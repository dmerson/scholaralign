using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Models;

namespace ScholarAlign.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // Lookup tables
    public DbSet<ScholarshipStatus> ScholarshipStatuses => Set<ScholarshipStatus>();
    public DbSet<OrganizationRoleName> OrganizationRoleNames => Set<OrganizationRoleName>();
    public DbSet<QuestionType> QuestionTypes => Set<QuestionType>();
    public DbSet<Operator> Operators => Set<Operator>();
    public DbSet<UserScholarshipStatus> UserScholarshipStatuses => Set<UserScholarshipStatus>();
    public DbSet<ApplicationDecision> ApplicationDecisions => Set<ApplicationDecision>();
    public DbSet<ReviewerDecision> ReviewerDecisions => Set<ReviewerDecision>();

    // Core entities
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<SubOrganization> SubOrganizations => Set<SubOrganization>();
    public DbSet<OrganizationUser> OrganizationUsers => Set<OrganizationUser>();
    public DbSet<OrganizationRole> OrganizationRoles => Set<OrganizationRole>();
    public DbSet<AwardYear> AwardYears => Set<AwardYear>();
    public DbSet<ScholarshipAbstract> ScholarshipAbstracts => Set<ScholarshipAbstract>();
    public DbSet<Scholarship> Scholarships => Set<Scholarship>();
    public DbSet<ScholarshipRequirement> ScholarshipRequirements => Set<ScholarshipRequirement>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<UserScholarship> UserScholarships => Set<UserScholarship>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<ApplicationQuestion> ApplicationQuestions => Set<ApplicationQuestion>();
    public DbSet<UserApplication> UserApplications => Set<UserApplication>();
    public DbSet<UserScholarshipApplication> UserScholarshipApplications => Set<UserScholarshipApplication>();
    public DbSet<UserApplicationAnswer> UserApplicationAnswers => Set<UserApplicationAnswer>();
    public DbSet<ScholarshipDecision> ScholarshipDecisions => Set<ScholarshipDecision>();
    public DbSet<ScholarshipReviewer> ScholarshipReviewers => Set<ScholarshipReviewer>();
    public DbSet<ScholarshipApplicationReview> ScholarshipApplicationReviews => Set<ScholarshipApplicationReview>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Organization>()
            .Property(o => o.OrganizationId)
            .ValueGeneratedNever();

        builder.Entity<Scholarship>()
            .Property(s => s.Amount)
            .HasPrecision(18, 2);

        builder.Entity<UserApplication>()
            .HasIndex(u => new { u.ApplicationId, u.AwardYearId, u.UserEmail })
            .IsUnique();

        builder.Entity<ScholarshipDecision>()
            .HasIndex(d => d.ScholarshipApplicationId)
            .IsUnique();

        // Scholarship statuses
        builder.Entity<ScholarshipStatus>().HasData(
            new ScholarshipStatus { ScholarshipStatusId = 1, ScholarshipStatusDescription = "Draft" },
            new ScholarshipStatus { ScholarshipStatusId = 2, ScholarshipStatusDescription = "Needs Coding" },
            new ScholarshipStatus { ScholarshipStatusId = 3, ScholarshipStatusDescription = "Coded" },
            new ScholarshipStatus { ScholarshipStatusId = 4, ScholarshipStatusDescription = "Live" },
            new ScholarshipStatus { ScholarshipStatusId = 5, ScholarshipStatusDescription = "Under Review" },
            new ScholarshipStatus { ScholarshipStatusId = 6, ScholarshipStatusDescription = "Awarded" },
            new ScholarshipStatus { ScholarshipStatusId = 7, ScholarshipStatusDescription = "Complete" }
        );

        // Organization role names
        builder.Entity<OrganizationRoleName>().HasData(
            new OrganizationRoleName { OrganizationRoleNameId = 1, OrganizationRoleNameDescription = "Scholarship Viewer" },
            new OrganizationRoleName { OrganizationRoleNameId = 2, OrganizationRoleNameDescription = "Organization Admin" },
            new OrganizationRoleName { OrganizationRoleNameId = 3, OrganizationRoleNameDescription = "Scholarship Maker" },
            new OrganizationRoleName { OrganizationRoleNameId = 4, OrganizationRoleNameDescription = "Reviewer" }
        );

        // Question types
        builder.Entity<QuestionType>().HasData(
            new QuestionType { QuestionTypeId = 1, QuestionTypeDescription = "Text" },
            new QuestionType { QuestionTypeId = 2, QuestionTypeDescription = "Int" },
            new QuestionType { QuestionTypeId = 3, QuestionTypeDescription = "Decimal" },
            new QuestionType { QuestionTypeId = 4, QuestionTypeDescription = "Checkbox List" },
            new QuestionType { QuestionTypeId = 5, QuestionTypeDescription = "Radiobutton List" },
            new QuestionType { QuestionTypeId = 6, QuestionTypeDescription = "Dropdown List" },
            new QuestionType { QuestionTypeId = 7, QuestionTypeDescription = "Date" },
            new QuestionType { QuestionTypeId = 8, QuestionTypeDescription = "DateTime" },
            new QuestionType { QuestionTypeId = 9, QuestionTypeDescription = "Time" },
            new QuestionType { QuestionTypeId = 10, QuestionTypeDescription = "Calculated" }
        );

        // Operators
        builder.Entity<Operator>().HasData(
            new Operator { OperatorId = 1, OperatorValue = "=",  OperatorShownName = "Equal" },
            new Operator { OperatorId = 2, OperatorValue = ">",  OperatorShownName = "Greater Than" },
            new Operator { OperatorId = 3, OperatorValue = "<",  OperatorShownName = "Less Than" },
            new Operator { OperatorId = 4, OperatorValue = "!=", OperatorShownName = "Not Equal" },
            new Operator { OperatorId = 5, OperatorValue = ">=", OperatorShownName = "Greater Than or Equal To" },
            new Operator { OperatorId = 6, OperatorValue = "<=", OperatorShownName = "Less Than or Equal To" },
            new Operator { OperatorId = 7, OperatorValue = "^",  OperatorShownName = "In List" },
            new Operator { OperatorId = 8, OperatorValue = "!^", OperatorShownName = "Not In List" }
        );

        // User scholarship statuses
        builder.Entity<UserScholarshipStatus>().HasData(
            new UserScholarshipStatus { UserScholarshipStatusId = 1, UserScholarshipStatusDescription = "Assigned" },
            new UserScholarshipStatus { UserScholarshipStatusId = 2, UserScholarshipStatusDescription = "Started" },
            new UserScholarshipStatus { UserScholarshipStatusId = 3, UserScholarshipStatusDescription = "Submitted" }
        );

        // Application decisions
        builder.Entity<ApplicationDecision>().HasData(
            new ApplicationDecision { DecisionId = 1, DecisionName = "In Progress" },
            new ApplicationDecision { DecisionId = 2, DecisionName = "Applied" },
            new ApplicationDecision { DecisionId = 3, DecisionName = "Under Review" },
            new ApplicationDecision { DecisionId = 4, DecisionName = "Rejected" },
            new ApplicationDecision { DecisionId = 5, DecisionName = "Accepted" },
            new ApplicationDecision { DecisionId = 6, DecisionName = "Awarded" }
        );

        // Reviewer decisions
        builder.Entity<ReviewerDecision>().HasData(
            new ReviewerDecision { ReviewerDecisionId = 1, ReviewerDecisionName = "Accepted" },
            new ReviewerDecision { ReviewerDecisionId = 2, ReviewerDecisionName = "Rejected" },
            new ReviewerDecision { ReviewerDecisionId = 3, ReviewerDecisionName = "In Progress" }
        );

        // Public organization seed
        builder.Entity<Organization>().HasData(
            new Organization
            {
                OrganizationId = Guid.Empty,
                OrganizationName = "Public",
                Contact = "don.e.merson1966@gmail.com",
                WebSite = string.Empty,
                IsPublic = true,
                CreatedBy = "system",
                CreatedOn = new DateTime(2026, 1, 1),
                UpdatedBy = "system",
                LastModified = new DateTime(2026, 1, 1)
            }
        );
    }
}
