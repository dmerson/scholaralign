# Home Page
Not under auth. Basic information describing what the site does. Single call-to-action button to the login page.

---

# Dashboard
Accessible after login. This is where the eligibility wizard runs. On every login the system seeds UserScholarships for any new Live scholarships in the user's organizations. The wizard then asks the user the next best unanswered question. The page shows progress (e.g. "X scholarships still unknown") and a completion message when no more questions remain. Once complete, the user is directed to the Scholarships page.

Role access: all authenticated users.

---

# Scholarships
Three tabs driven by UserScholarshipStatus:
- **Eligible** (status = 1) — default view. Shows scholarship name, amount, deadline, and a link to the application.
- **Unknown** (status = 0) — scholarships where the wizard has not yet gathered enough answers to determine eligibility.
- **Ineligible** (status = -1) — scholarships the user does not qualify for. Collapsed or lower prominence.

Role access: all authenticated users.

---

# Applications
A list of Applications the user can fill out, grouped or labeled by which eligible scholarships each application covers. Clicking an application opens the Application Detail page.

Role access: all authenticated users.

## Application Detail
The actual form. Displays each question from ApplicationQuestions in order. Answers are saved to UserApplicationAnswers as the user progresses. A Submit button finalizes the submission (sets SubmittedDate, updates UserScholarshipApplications to Submitted, updates ScholarshipDecisions to Applied for all linked scholarships). A user can return and update answers before submission.

---

# Reviewer
Accessible to users with the Reviewer role who are members of a committee (SubOrganization) assigned to at least one scholarship via ScholarshipCommittees.

## Reviewer — Scholarship List
Lists all scholarships the reviewer's committee is assigned to where ScholarshipStatus is Under Review. Scholarships marked Awarded no longer appear.

## Reviewer — Applicant List
Clicking a scholarship shows all UserScholarshipApplications for that ScholarshipId with UserScholarshipStatusId = Submitted (3). Displays applicant email and submitted date. Reviewer can click into any applicant to write a review.

## Reviewer — Applicant Review Form
Shows the applicant's submitted answers (pulled via UserApplication → ApplicationQuestions → UserApplicationAnswers). The reviewer enters ReviewerNotes, ReviewerRating, and ReviewerDecision (from ReviewerDecisions: Accepted, Rejected, In Progress) and saves a ScholarshipReviews record. A reviewer can update their review until the scholarship is awarded.

---

# Award Scholarships
Accessible to Organization Admin role only. Lists scholarships that are past their EndDate and have status Under Review. For each scholarship, displays all applicants with their submitted ScholarshipReviews (notes, ratings, decisions from all committee members). The awarding user selects one or more candidates, which sets their ScholarshipDecisions.DecisionId to Accepted or Awarded and updates UserScholarshipApplications.UserScholarshipStatusId accordingly. Rejected applicants are updated to Rejected. Once all decisions are made, the scholarship ScholarshipStatus is set to Awarded and it disappears from the reviewer and awarding queues.

---

# Organization Admin
Accessible to users with the Organization Admin role.

## Award Years
List view. Add, edit, delete. Cannot delete an AwardYear that is referenced by a Scholarship or UserApplication.

## Organization Users and Roles
Two panels:
- Add users to the organization (inserts into OrganizationUsers).
- Assign roles to users (inserts into OrganizationRoles with an OrganizationRoleNameId). A user can hold more than one role.

## Organization Hierarchy
Manage SubOrganizations (committees and departments). Add, edit. Cannot delete in the interface. Assign users from OrganizationUsers to a SubOrganization (inserts into SubOrganizationUsers). Supports parent/child hierarchy via SubOrganizationParentId.

## Assign Committees to Scholarships
Links a SubOrganization (committee) to one or more scholarships via ScholarshipCommittees. Dropdown selects the committee; a checklist or search selects which scholarships to assign it to.

## Scholarships
List of all scholarships belonging to this organization and its SubOrganizations. Add, edit, delete. Cannot delete a scholarship that has ScholarshipRequirements attached.

### Create Scholarship
Step 1: Enter ScholarshipAbstract fields (ScholarshipName, ScholarshipDescription, OrganizationId, SubOrganizationId). Hit Create. Step 2: Full Scholarship fields appear (URL, awarding info, eligibility info, AwardYearId, Amount, AmountDescription, StartDate, EndDate, ApplicationId, ScholarshipStatus).

### Scholarship Requirements (Coding)
Accessible from the edit screen when ScholarshipStatus is Needs Coding or Coded. Lists existing ScholarshipRequirements for the scholarship. Add a requirement by selecting a Question, an Operator, entering a RequirementValue, and assigning a Grouping number. Edit and delete are allowed. Saving the last requirement and marking the scholarship Coded sets ScholarshipStatus = 3. Cannot delete a requirement if the scholarship is Live.

---

# Public Admin
Accessible to Organization Admin of the public organization (OrganizationId = Guid.Empty). Manages the shared lookup data that all organizations use.

## Organizations
List view. Add, edit. Cannot delete via the interface.

## Suborganizations
List view. Add, edit. Cannot delete via the interface.

## Questions
List view. Add, edit, delete. Cannot delete a Question that exists in any ScholarshipRequirement.

## Award Years
List view. Add, edit, delete. Cannot delete an AwardYear that is referenced by a Scholarship or UserApplication.

## Public Scholarships
List of scholarships belonging to the public organization (OrganizationId = Guid.Empty). Add, edit, delete. Cannot delete a scholarship with ScholarshipRequirements attached. If deleting a scholarship leaves its ScholarshipAbstractId with no remaining scholarships, the ScholarshipAbstract record is also deleted.
