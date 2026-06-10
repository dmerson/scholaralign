# Structure of Student Answers

Both `Answers.Answer` (wizard) and `UserApplicationAnswers.ApplicationAnswerValue` (application form) store answers as JSON using the same structure. All values are stored as strings inside a `value` key. Multi-select questions use a JSON array of strings. Numbers, decimals, and dates are stored as strings and parsed using the `QuestionTypeId` from the `Questions` table when the eligibility engine evaluates them.

## Single-value answers
```json
{ "value": "3.5" }
{ "value": "undergraduate" }
{ "value": "sam's club" }
{ "value": "2024-01-15" }
```

## Multi-value answers (Checkbox List)
```json
{ "value": ["white", "black"] }
{ "value": ["Freshman", "Junior"] }
```

## Why strings for numbers and dates
Storing numbers as JSON number literals risks floating-point drift and locale-specific decimal separator issues. Storing as strings and casting based on `QuestionTypeId` at evaluation time is deterministic. Dates use ISO 8601 format (`YYYY-MM-DD`, `YYYY-MM-DDTHH:MM:SS`, `HH:MM:SS`).

## RequirementValue uses the same structure
`ScholarshipRequirements.RequirementValue` stores the comparison target for eligibility evaluation and follows the same format. The engine already has `OperatorId` to know how to compare and `QuestionTypeId` to know how to cast.
```json
{ "value": "3.5" }               -- used with operator >= for GPA check
{ "value": ["white", "black"] }  -- used with operator ^ (In List) for race check
```

## QuestionTypeAttributes structure
`Questions.QuestionTypeAttributes` stores configuration about the question, not an answer. Structure varies by question type:
```json
-- Checkbox List / Radio Button / Dropdown
{ "options": ["Freshman", "Sophomore", "Junior", "Senior"] }

-- Calculated (e.g. age derived from a date answer)
{ "calculation": "age", "sourceField": "DateOfBirth" }

-- Int / Decimal (optional range validation)
{ "min": "0", "max": "4.0" }

-- Text (optional length cap)
{ "maxLength": "500" }
```

---

# Scholarship Availability Rules

Before the wizard or requirement engine runs, a scholarship must pass the **availability filter**. This is a pre-check applied on every login (during the sync step) that determines which scholarships are even visible to a user. A scholarship that fails the availability filter is never added to the user's UserScholarships table, and the wizard will never ask questions about it.

## Rule 1 — Status must be Live

Only scholarships with `ScholarshipStatus = 4 (Live)` are considered. Scholarships in Draft, Needs Coding, Coded, Under Review, Awarded, or Complete are excluded.

## Rule 2 — Dates must be present and in range

Both `StartDate` and `EndDate` must be non-null. If either is null, the scholarship is excluded. If both are present, today's date must satisfy:

```
StartDate <= today <= EndDate
```

A scholarship whose window has not yet opened, or whose deadline has passed, is excluded even if the user would otherwise qualify.

## Rule 3 — Organization access

A scholarship passes if **either** condition is true:

### 3a — Public organization (visible to everyone)

The scholarship's owning organization has `IsPublic = true`. Any live, in-range scholarship owned by a public organization is added to every user's eligibility pool on login.

### 3b — Org membership (private organization)

The scholarship's owning organization has `IsPublic = false`. The user must be a member of that organization, determined by:

1. **Direct membership** — a record exists in `OrganizationUsers` where `OrganizationId = scholarship.OrganizationId` and `UserEmail = user's email`.

2. **SubOrganization cascade** — the user is a member of any `SubOrganization` (via `SubOrganizationUsers`) where `SubOrganization.OrganizationId = scholarship.OrganizationId`. Being a member of any sub-department, committee, or child unit within an organization grants access to all of that organization's scholarships. This means a user in "ME Scholarship Committee" (a SubOrg under "University of Arizona") automatically has access to all University of Arizona scholarships.

## Summary table

| Condition | Result |
|---|---|
| Status ≠ Live (4) | Excluded |
| StartDate or EndDate is null | Excluded |
| Today < StartDate or today > EndDate | Excluded |
| Org.IsPublic = true | **Included for everyone** |
| User in OrganizationUsers for scholarship's org | **Included** |
| User in SubOrganizationUsers for any SubOrg in scholarship's org | **Included** |

## Example — Mixed access on login

User **alice@ua.edu** is in:
- `OrganizationUsers` → University of Arizona (org A, IsPublic = false)
- `SubOrganizationUsers` → ME Scholarship Committee (SubOrg under org A)

Active Live scholarships with valid dates:
| Scholarship | Org | Org.IsPublic |
|---|---|---|
| Dean's Award | Public (Guid.Empty) | true |
| UA Engineering Award | University of Arizona | false |
| MIT Research Grant | MIT | false |

On login sync:
- **Dean's Award** → IsPublic = true → added for alice (and every user)
- **UA Engineering Award** → alice is a direct member of UA → added
- **MIT Research Grant** → alice is not in MIT → **excluded**

---

# Wizard Engine Logic

The first thing that happens when you login to the application is the wizard is invoked. The home page is the determined by the result of the wizard in the form of a question. To determine what question to show we have look at the user's scholarships.

## User must be in organization
To determine if a user is allowed to view a scholarship, they must be part of that organizaiton. Everyone is automatically put into the public organization and see everyone that IsPublic is true. A university can make their scholarships only visible to members of that university by the organizationid on scholarships. They would then have to allow their users into their organization by inserting them into OrganizationUsers.

## Put data in UserScholarships
On every login, a record is put in UserScholarships for every Live scholarship (ScholarshipStatus = 4) in the user's organization that does not already have a UserScholarships record. Scholarships in Draft, Needs Coding, Coded, or other statuses are excluded. New records are set to UserScholarshipStatus = 0 (unknown). Scholarships that already have a record retain their existing status — they are placed directly into the correct bucket page (eligible = 1, unknown = 0, ineligible = -1) without re-running the wizard on them. This means a scholarship that went Live between logins will appear in the unknown pile and the wizard will begin asking relevant questions for it.

## Determine next best question
The first thing it checks is if a question with a questionorder column. It will pick the lowest number question without an answer. If none of these exist then the ScholarshipRequirments for the UserScholarships are tallied up and the QuesitonId that happens the most is determined to be the next best question.

## User reacts with question
The user is then shown the question. They then answer the question and it is saved to the answers table. Every time an answer is saved or updated, the scholarship requirements for any scholarship assigned to the user having that questionid are recalculated to determine the UserScholarships. This means changing an existing answer will re-evaluate eligibility and may change a scholarship's status in either direction. For each scholarship requirement determine if the user's answers make them eligible. You pull up all the valid scholarship eligible items. Then you determine if the answer is true or not true. The scholarshiprequirement will be something like GPA > 3.5. If user's answer is 3.6 then this is marked as true in this case. You do this will for the whole list. Then you look for any scholarship requirments grouping that are complete. If any of the grouping for a scholarship are blank, you mark the scholarship status to 0. If any the groupings are complete  and the answers are true, you update the ScholarshipStatus to 1.  If all of the scholarship groups are false, then you update the status to -1. The order here is important because if one grouping is false and the other true, the answer is true. If one grouping is missing an answer and the other is false, the answer is unknown.

## Run the wizard again
We use the same logic as the determine the next best question. If no more questions are retreived you can give the user the message that the wizard is complete and they can look at their scholarships.

## The result of the wizard
You now have three stacks of scholarships for this user by looking at their scholarship status. You have the eligible pile with status =1, unknown with status =0, and ineligible with the status of -1. These will be three pages that the user sees with the eligible page as the default.

The user views their scholarships on these pages. A separate Applications tab shows a list of applications to fill out, each displaying which scholarships it links up with. The user navigates to the Applications tab when they are ready to apply.

---

# Requirement Evaluation Examples

The following examples show how ScholarshipRequirements are evaluated against a user's Answers to produce a UserScholarshipStatus. All examples use these questions: GPA (Decimal), StudentLevel (Dropdown: Undergraduate/Graduate), Race (Checkbox List), CurrentClassType (Dropdown: Freshman/Sophomore/Junior/Senior/Masters/PhD).

---

## Example 1: Eligible — Dean's Merit Award

The user has answered all questions and satisfies every requirement in the single group. The scholarship moves to the eligible pile.

**Requirements (all Grouping = 1)**

| Question | Operator | RequirementValue |
|---|---|---|
| GPA | >= | `{"value": "3.5"}` |
| StudentLevel | = | `{"value": "Undergraduate"}` |

**User's Answers**

| Question | Answer |
|---|---|
| GPA | `{"value": "3.8"}` |
| StudentLevel | `{"value": "Undergraduate"}` |

**Evaluation**
- GPA: 3.8 >= 3.5 → TRUE
- StudentLevel: Undergraduate = Undergraduate → TRUE
- Group 1 is complete and all TRUE → **UserScholarshipStatus = 1 (Eligible)**

---

## Example 2: Unknown — Minority STEM Scholarship

The user has answered some questions but not Race. Because one requirement in the only group is unanswered, the engine cannot determine eligibility and the scholarship sits in the unknown pile until the user answers Race.

**Requirements (all Grouping = 1)**

| Question | Operator | RequirementValue |
|---|---|---|
| GPA | >= | `{"value": "3.0"}` |
| Race | ^ (In List) | `{"value": ["Black", "Hispanic", "Native American"]}` |

**User's Answers**

| Question | Answer |
|---|---|
| GPA | `{"value": "3.2"}` |
| Race | (not yet answered) |

**Evaluation**
- GPA: 3.2 >= 3.0 → TRUE
- Race: no answer → UNKNOWN
- Group 1 has an unanswered question → **UserScholarshipStatus = 0 (Unknown)**

---

## Example 3: Multi-Value In List — Underclassman Award

When the **In List** or **Not In List** operator is used, the `RequirementValue` contains an array of *acceptable* answers. The requirement is TRUE if the applicant's answer matches **any** value in that list.

**Requirements (all Grouping = 1)**

| Question | Operator | RequirementValue |
|---|---|---|
| CurrentClassType | ^ (In List) | `["Freshman", "Sophomore"]` |
| GPA | >= | `3.0` |

**Scenario A — Freshman applicant (eligible)**

| Question | Answer |
|---|---|
| CurrentClassType | `Freshman` |
| GPA | `3.4` |

- CurrentClassType: "Freshman" is in ["Freshman", "Sophomore"] → **TRUE**
- GPA: 3.4 >= 3.0 → **TRUE**
- Group 1 complete and all TRUE → **UserScholarshipStatus = 1 (Eligible)**

**Scenario B — Junior applicant (ineligible)**

| Question | Answer |
|---|---|
| CurrentClassType | `Junior` |
| GPA | `3.8` |

- CurrentClassType: "Junior" is in ["Freshman", "Sophomore"] → **FALSE**
- GPA: 3.8 >= 3.0 → TRUE but one requirement is FALSE
- Group 1 complete and at least one FALSE → **UserScholarshipStatus = -1 (Ineligible)**

**Key rule:** In List checks whether the applicant's single answer appears anywhere in the requirement's value array. For Checkbox List answers (where the user picks multiple items), In List is TRUE if *any* of the user's selected items appears in the requirement array. Not In List is TRUE only if *none* of the user's selected items appears in the requirement array.

---

## Example 4: Ineligible — High-GPA Freshman Award

The user has answered all questions but fails every requirement in the only group. The scholarship moves to the ineligible pile.

**Requirements (all Grouping = 1)**

| Question | Operator | RequirementValue |
|---|---|---|
| CurrentClassType | ^ (In List) | `["Freshman"]` |
| GPA | >= | `3.7` |

**User's Answers**

| Question | Answer |
|---|---|
| CurrentClassType | `Junior` |
| GPA | `3.2` |

**Evaluation**
- CurrentClassType: "Junior" in ["Freshman"] → FALSE
- GPA: 3.2 >= 3.7 → FALSE
- Group 1 is complete and all FALSE → **UserScholarshipStatus = -1 (Ineligible)**

---

## Example 5: Multi-Group, One Valid — Academic Excellence Scholarship

This scholarship is open to either undergraduates with a 3.5+ GPA or graduate students with a 3.0+ GPA. The two groups represent two separate paths to eligibility — satisfying either one is enough. The user is an undergraduate with a 3.8 GPA so Group 1 passes even though Group 2 fails.

**Requirements**

| Question | Operator | RequirementValue | Grouping |
|---|---|---|---|
| StudentLevel | = | `{"value": "Undergraduate"}` | 1 |
| GPA | >= | `{"value": "3.5"}` | 1 |
| StudentLevel | = | `{"value": "Graduate"}` | 2 |
| GPA | >= | `{"value": "3.0"}` | 2 |

**User's Answers**

| Question | Answer |
|---|---|
| StudentLevel | `{"value": "Undergraduate"}` |
| GPA | `{"value": "3.8"}` |

**Evaluation**
- Group 1: StudentLevel Undergraduate = Undergraduate → TRUE, GPA 3.8 >= 3.5 → TRUE → Group 1 complete and ALL TRUE
- Group 2: StudentLevel Undergraduate = Graduate → FALSE, GPA 3.8 >= 3.0 → TRUE → Group 2 has a FALSE → Group 2 fails
- At least one group is complete and all TRUE → **UserScholarshipStatus = 1 (Eligible)**

This is the key rule: a scholarship is eligible if **any** grouping is fully satisfied, regardless of the outcome of other groupings.

---

# Application Submission Flow

## User submits an application
When a user decides to apply, a UserApplications record is created linking their UserEmail to the ApplicationId and AwardYearId. This represents one submission of a form for a given year. Once created, the system finds all Scholarships where ApplicationId matches and AwardYearId matches, and creates a UserScholarshipApplications record for each one with UserScholarshipStatusId = 1 (Assigned). This is what allows a user to fill out one application and be considered for many scholarships simultaneously. At this point a ScholarshipDecisions record is also created for each linked scholarship with DecisionId = 1 (In Progress) to record that the user has started the process, with ReviewersEmail left null as no reviewer is involved yet.

## User fills out application questions
The questions for the application are retrieved from ApplicationQuestions where ApplicationId matches. When the user opens the application form for the first time, UserScholarshipApplications.UserScholarshipStatusId is updated to 2 (Started) for all linked scholarship applications. The user answers each question and each answer is saved to UserApplicationAnswers with the UserApplicationId and ApplicationQuestionId. Answers can be updated at any time before submission; the LastModified field tracks the most recent change. CreatedOn records when the answer was first given.

## User submits the application
When the user submits, UserApplications.SubmittedDate is set to the current datetime, UserScholarshipApplications.UserScholarshipStatusId is updated to 3 (Submitted), and ScholarshipDecisions.DecisionId is updated to 2 (Applied) for all linked scholarship applications. The application is now available for review.

---

# Review Flow

## When review begins
The review process is triggered after a scholarship's EndDate has passed. The Organization Admin sets ScholarshipStatus to 5 (Under Review), which makes the scholarship visible in the reviewer queue and in the Award Scholarships page.

## Committee setup
Before review begins, the Organization Admin:
1. Creates or designates a SubOrganization as the review committee.
2. Assigns users from the organization to the committee via SubOrganizationUsers (SubOrganizationId + UserEmail).
3. Links the committee to one or more scholarships via ScholarshipCommittees (SubOrganizationId + ScholarshipId).

A committee can be assigned to multiple scholarships. Each user in the committee becomes a reviewer for every scholarship that committee is assigned to.

## Reviewer sees their queue
A user with the Reviewer role whose email appears in SubOrganizationUsers for a committee that is linked to a scholarship (via ScholarshipCommittees) will see that scholarship in their reviewer queue — but only while ScholarshipStatus = 5 (Under Review). Scholarships with status 6 (Awarded) or 7 (Complete) do not appear.

## Reviewer writes a review
For each scholarship in their queue the reviewer sees a list of all UserScholarshipApplications for that ScholarshipId where UserScholarshipStatusId = 3 (Submitted). The reviewer clicks into an applicant and sees their submitted answers, retrieved by following:

UserScholarshipApplications.UserApplicationId → UserApplications.ApplicationId → ApplicationQuestions → UserApplicationAnswers filtered by UserApplicationId.

The reviewer writes a ScholarshipReviews record:
- ScholarshipApplicationId: the specific UserScholarshipApplications record (ties the review to this applicant for this scholarship specifically, not just the generic application form)
- ReviewerEmail: the reviewer's email
- ReviewerNotes, ReviewerRating, ReviewerDecision (from ReviewerDecisions: 1 Accepted, 2 Rejected, 3 In Progress)

A reviewer can update their ScholarshipReviews record at any time until the scholarship is awarded.

## Why ScholarshipApplicationId and not just ScholarshipId
Two scholarships can share the same Application (e.g. both require only a resume upload). A reviewer evaluating the same candidate for both scholarships writes two separate ScholarshipReviews records — one per ScholarshipApplicationId — with different notes and decisions. The Low Income scholarship review may note the candidate lacks financial need; the Merit scholarship review may rate them highly. These are different records because UserScholarshipApplications produces a unique ScholarshipApplicationId per user per scholarship, even when the underlying Application form is shared.

## Awarding
The awarding user (Organization Admin) opens the Award Scholarships page and selects a scholarship. They see every applicant alongside the collated ScholarshipReviews from all committee members (notes, ratings, decisions). They select one or more winners and confirm. The system:
1. Sets ScholarshipDecisions.DecisionId = 6 (Awarded) for winners and updates ReviewersEmail to the awarding user.
2. Sets ScholarshipDecisions.DecisionId = 4 (Rejected) for non-winners.
3. Updates UserScholarshipApplications.UserScholarshipStatusId to reflect Awarded or Rejected.
4. Sets Scholarships.ScholarshipStatus = 6 (Awarded).

Once ScholarshipStatus = 6, the scholarship disappears from the reviewer queue and the awarding page. It no longer shows as an active scholarship for new applicants.
