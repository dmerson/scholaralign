ScholarshipAbstracts
-  ScholarshipAbstractId Guid
- ScholarshipName nvarchar(200)
- ScholarshipDescription nvarchar(8000)
- OrganizationId Guid
- SubOrganizationId Guid nullable
- CreatedBy nvarchar(256) -(Email of User)
- CreatedOn datetime2
- UpdatedBy nvarchar(256) - (Email of User)
- LastModified datetime2

Scholarships   
- ScholarshipId Guid
- ScholarshipAbstractId Guid
- ScholarshipUrl nvarchar(256)
- AwardingInformation nvarchar(2000)
- EligibilityInformation nvarchar(2000)
- AwardYearId Guid
- Amount decimal(18,2) (Amount to be used when determining amount of scholaships in total-need number to do math)
- AmountDescription nvarchar(20) (Allows user to enter things like 50-100$)
- StartDate datetime2
- EndDate datetime2
- ApplicationId Guid nullable
- ScholarshipStatus int
- CreatedBy nvarchar(256) -(Email of User)
- CreatedOn datetime2
- UpdatedBy nvarchar(256) - (Email of User)
- LastModified datetime2

ScholarshipStatuses  doesn't need a page
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


AwardYears Needs a page under Admin
- AwardYearId Guid
- OrganizationId Guid
- AwardYearDescription nvarchar(30)
- Year int
- Semester nvarchar(50)
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

Organizations -Needs a page under admin
- OrganizationId Guid
- OrganizationName nvarchar(200)
- Contact nvarchar(256)
- WebSite nvarchar(256)
- IsPublic bit determines if everyone can view scholarship
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

Organizations Seed
EmptyGuid Public don.e.merson1966@gmail.com 1 

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
Users can have more than 1 role

OrganizationRoleNames
- OrganizationRoleNameId int
- OrganizationRoleNameDescription nvarchar(20)

OrganizationRoleNames Seeds
- 1 Scholarship Viewer
- 2 Organization Admin
- 3 Scholarship Maker
- 4 Reviewer
Rolenames determined what pages a user can see


SubOrganizations
- SubOrganizationId Guid
- OrganizationId Guid
- SubOrganizationName nvarchar(100)
- SubOrganizationParentId Guid nullable
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2



Questions  -Needs a page under admin
- QuestionId Guid
- QuestionDescription nvarchar(1000)
- QuestionTypeId int
- QuestionOrder int nullable
- QuestionTypeAttributes nvarchar(max) (json things like a calcuation for age)
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

QuestionTypes - Doesn't need a page
- QuestionTypeId int
- QuestionTypeDescription nvarchar(30)

QuestionType Description Seeds
- 1- Text
- 2 - Int
- 3 - Decimal
- 4 - Checkbox List (allows multiple values)
- 5 - Radiobutton List (allows one value)
- 6 - Dropdown List (Allows one value)
- 7 - Date
- 8 - DateTime
- 9 - Time
- 10 - Calculated (Things like age)

Operators -Doesn't need a page
- OperatorId int
- OperatorValue nvarchar(2)
- OperatorShownName nvarchar(30)

Operator Seed Values
- 1- = Equal
- 2 = > Greater Than
- 3 - < Less Than
- 4- != Not Equal
- 5- >= Greater Than or Equal To
- 6- <= Less Than or Equal To
- 7- ^  In List
- 8 !^ Not In List

ScholarshipRequirements
- ScholarshipRequirementId Guid
- ScholarshipId Guid
- QuestionId Guid
- OperatorId int
- RequirementValue nvarchar(8000) JSON stored in this field
- Grouping int allows multiple groups of requirements to appear default is 1
- CreatedBy nvarchar(256) -(Email of User)
- CreatedOn datetime2
- UpdatedBy nvarchar(256) - (Email of User)
- LastModified datetime2


Answers
- AnswerId Guid
- QuestionId Guid
- UserEmail nvarchar(256)
- Answer nvarchar(max) JSON
- CreatedOn datetime2
- LastModified datetime2

UserScholarships
- UserScholarshipsId Guid
- UserEmail nvarchar(256)
- ScholarshipId Guid
- UserScholarshipStatus int -1 for ineligible 0 for unknown 1 for eligible
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

UserScholarshipApplications
- ScholarshipApplicationId Guid
- ScholarshipId Guid
- UserApplicationId Guid
- UserEmail nvarchar(256) (denormalized from UserApplications for query convenience - must match UserApplications.UserEmail)
- UserScholarshipStatusId int
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

UserScholarshipStatuses
- UserScholarshipStatusId int
- UserScholarshipStatusDescription nvarchar(20)

UserScholarshipStatus Seed
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


ScholarshipDecisions (ScholarshipApplicationId should be unique - one active decision record per submission, updated as status progresses)
- ScholarshipApplicationDecisionId Guid
- ScholarshipApplicationId Guid
- ReviewersEmail nvarchar(256) nullable (null when system-generated, such as on initial application)
- DecisionId int
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

ApplicationDecisions
- DecisionId int
- DecisionName nvarchar(20)

ApplicationDecisions Seed
- 1 In Progress (set when user starts the application process)
- 2 Applied (set when user submits the completed form)
- 3 Under Review
- 4 Rejected
- 5 Accepted
- 6 Awarded

ScholarshipReviewers
- ScholarshipReviewerId Guid
- ScholarshipId Guid
- ReviewEmail nvarchar(256)
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

ScholarshipApplicationReviews
- ScholarshipApplicationReviewId Guid
- ScholarshipApplicationId Guid
- ReviewEmail nvarchar(256)
- ReviewerNotes nvarchar(8000)
- ReviewerDecision int nullable
- ReviewerRating int nullable
- CreatedBy nvarchar(256)
- CreatedOn datetime2
- UpdatedBy nvarchar(256)
- LastModified datetime2

ReviewerDecisions
- ReviewerDecisionId int
- ReviewerDecisionName nvarchar(20)

ReviewerDecisions Seed
- 1 Accepted
- 2 Rejected
- 3 In Progress