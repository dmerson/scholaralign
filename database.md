ScholarshipAbstracts
- ScholarshipAbstractId Guid
- ScholarshipName nvarchar(200)
- ScholarshipDescription nvarchar(8000)
- OrganizationId Guid
- SubOrganizationId Guid nullable
- CreatedBy nvarchar(256) (Email of User)
- CreatedOn datetime2
- UpdatedBy nvarchar(256) (Email of User)
- LastModified datetime2

Scholarships
- ScholarshipId Guid
- ScholarshipAbstractId Guid
- ScholarshipUrl nvarchar(256) nullable
- AwardingInformation nvarchar(2000) nullable
- EligibilityInformation nvarchar(2000) nullable
- AwardYearId Guid nullable
- Amount decimal(18,2) nullable (Amount used when determining total scholarship pool)
- AmountDescription nvarchar(20) nullable (Allows user to enter things like $50-100)
- StartDate datetime2 nullable
- EndDate datetime2 nullable
- ApplicationId Guid nullable
- ScholarshipStatus int
- CreatedBy nvarchar(256) (Email of User)
- CreatedOn datetime2
- UpdatedBy nvarchar(256) (Email of User)
- LastModified datetime2

ScholarshipStatuses (no page needed)
- ScholarshipStatusId int
- ScholarshipStatusDescription nvarchar(20)

ScholarshipStatuses Seed
- 1 Draft
- 2 Needs Coding
- 3 Coded
- 4 Live
- 5 Under Review
- 6 Awarded
- 7 Complete

AwardYears (needs a page under Admin)
- AwardYearId Guid
- OrganizationId Guid
- AwardYearDescription nvarchar(30)
- Year int
- Semester nvarchar(50)
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

Organizations (needs a page under admin)
- OrganizationId Guid
- OrganizationName nvarchar(200)
- Contact nvarchar(256)
- WebSite nvarchar(256)
- IsPublic bit (determines if everyone can view scholarship)
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

Organizations Seed
- Guid.Empty "Public" don.e.merson1966@gmail.com IsPublic=true

OrganizationUsers
- OrganizationUserId Guid
- OrganizationId Guid
- UserEmail nvarchar(256)
- CreatedBy nvarchar(256)
- CreatedOn datetime2

OrganizationRoles
- OrganizationRoleId Guid
- OrganizationId Guid
- UserEmail nvarchar(256)
- OrganizationRoleNameId int
- CreatedBy nvarchar(256)
- CreatedOn datetime2
Users can have more than one role.

OrganizationRoleNames
- OrganizationRoleNameId int
- OrganizationRoleNameDescription nvarchar(20)

OrganizationRoleNames Seed
- 1 Scholarship Viewer
- 2 Organization Admin
- 3 Scholarship Maker
- 4 Reviewer
Role names determine what pages a user can see.

SubOrganizations
- SubOrganizationId Guid
- OrganizationId Guid
- SubOrganizationName nvarchar(100)
- SubOrganizationParentId Guid nullable
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

SubOrganizationUsers
- SubOrganizationUserId Guid
- SubOrganizationId Guid
- UserEmail nvarchar(256)
- CreatedBy nvarchar(256)
- CreatedOn datetime2

ScholarshipCommittees
- ScholarshipCommitteeId Guid
- ScholarshipId Guid
- SubOrganizationId Guid
- CreatedBy nvarchar(256)
- CreatedOn datetime2

Questions (needs a page under admin)
- QuestionId Guid
- QuestionDescription nvarchar(1000)
- QuestionTypeId int
- QuestionOrder int nullable
- QuestionTypeAttributes nvarchar(max) (JSON — options, calculation config, validation range)
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

QuestionTypes (no page needed)
- QuestionTypeId int
- QuestionTypeDescription nvarchar(30)

QuestionTypes Seed
- 1 Text
- 2 Int
- 3 Decimal
- 4 Checkbox List (allows multiple values)
- 5 Radiobutton List (allows one value)
- 6 Dropdown List (allows one value)
- 7 Date
- 8 DateTime
- 9 Time
- 10 Calculated (e.g. age derived from a date answer)

Operators (no page needed)
- OperatorId int
- OperatorValue nvarchar(2)
- OperatorShownName nvarchar(30)

Operators Seed
- 1  =   Equal
- 2  >   Greater Than
- 3  <   Less Than
- 4  !=  Not Equal
- 5  >=  Greater Than or Equal To
- 6  <=  Less Than or Equal To
- 7  ^   In List
- 8  !^  Not In List

ScholarshipRequirements
- ScholarshipRequirementId Guid
- ScholarshipId Guid
- QuestionId Guid
- OperatorId int
- RequirementValue nvarchar(8000) (JSON — same structure as Answers)
- Grouping int (groups of requirements; default 1; any complete true group = eligible)
- CreatedBy nvarchar(256) (Email of User)
- CreatedOn datetime2
- UpdatedBy nvarchar(256) (Email of User)
- LastModified datetime2

Answers
- AnswerId Guid
- QuestionId Guid
- UserEmail nvarchar(256)
- Answer nvarchar(max) (JSON)
- CreatedOn datetime2
- LastModified datetime2

UserScholarships
- UserScholarshipsId Guid
- UserEmail nvarchar(256)
- ScholarshipId Guid
- UserScholarshipStatus int (-1 ineligible, 0 unknown, 1 eligible)
- CreatedOn datetime2
- LastModified datetime2

Applications
- ApplicationId Guid
- OrganizationId Guid
- ScholarshipApplicationName nvarchar(50)
- SubOrganizationId Guid nullable
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

ApplicationQuestions
- ApplicationQuestionId Guid
- ApplicationId Guid
- QuestionId Guid
- Order int
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

UserApplications
- UserApplicationId Guid
- ApplicationId Guid
- AwardYearId Guid
- UserEmail nvarchar(256)
- SubmittedDate datetime2 nullable
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2
Unique index on (ApplicationId, AwardYearId, UserEmail) — one submission per user per application per year.

UserScholarshipApplications
- ScholarshipApplicationId Guid (PK)
- ScholarshipId Guid
- UserApplicationId Guid
- UserEmail nvarchar(256) (denormalized from UserApplications for query convenience)
- UserScholarshipStatusId int
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

UserScholarshipStatuses (no page needed)
- UserScholarshipStatusId int
- UserScholarshipStatusDescription nvarchar(20)

UserScholarshipStatuses Seed
- 1 Assigned
- 2 Started
- 3 Submitted

UserApplicationAnswers
- ScholarshipApplicationAnswerId Guid
- UserApplicationId Guid
- ApplicationQuestionId Guid
- ApplicationAnswerValue nvarchar(max)
- CreatedOn datetime2
- LastModified datetime2

ScholarshipDecisions (unique index on ScholarshipApplicationId — one active decision record per submission)
- ScholarshipApplicationDecisionId Guid
- ScholarshipApplicationId Guid
- ReviewersEmail nvarchar(256) nullable (null when system-generated on initial application)
- DecisionId int
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

ApplicationDecisions (no page needed)
- DecisionId int
- DecisionName nvarchar(20)

ApplicationDecisions Seed
- 1 In Progress (set when user starts the application process)
- 2 Applied (set when user submits the completed form)
- 3 Under Review
- 4 Rejected
- 5 Accepted
- 6 Awarded

ScholarshipReviews
- ScholarshipReviewId Guid
- ScholarshipApplicationId Guid (from UserScholarshipApplications — unique per user per scholarship)
- ReviewerEmail nvarchar(256)
- ReviewerNotes nvarchar(8000) nullable
- ReviewerDecision int nullable
- ReviewerRating int nullable
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

ReviewerDecisions (no page needed)
- ReviewerDecisionId int
- ReviewerDecisionName nvarchar(20)

ReviewerDecisions Seed
- 1 Accepted
- 2 Rejected
- 3 In Progress
