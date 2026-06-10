using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Tests.Helpers;

/// <summary>
/// Factory methods for creating in-memory DbContexts and minimal test entities.
/// Each CreateFresh() call gets a unique database so tests are fully isolated.
/// </summary>
public static class DbHelper
{
    private static readonly DateTime _now = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    private const string _sys = "test";

    // ── DB factory ──────────────────────────────────────────────────────

    public static ApplicationDbContext CreateFresh()
    {
        var opts = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(opts);
    }

    // ── Entity builders ─────────────────────────────────────────────────

    public static Organization MakeOrg(Guid? id = null, bool isPublic = true) => new()
    {
        OrganizationId = id ?? Guid.NewGuid(),
        OrganizationName = "Test Org",
        Contact = string.Empty,
        WebSite = string.Empty,
        IsPublic = isPublic,
        CreatedBy = _sys, CreatedOn = _now, UpdatedBy = _sys, LastModified = _now
    };

    public static ScholarshipAbstract MakeAbstract(Guid orgId, Guid? id = null) => new()
    {
        ScholarshipAbstractId = id ?? Guid.NewGuid(),
        ScholarshipName = "Test Scholarship",
        ScholarshipDescription = string.Empty,
        OrganizationId = orgId,
        CreatedBy = _sys, CreatedOn = _now, UpdatedBy = _sys, LastModified = _now
    };

    public static Scholarship MakeScholarship(Guid abstractId, bool live = true, Guid? id = null) => new()
    {
        ScholarshipId = id ?? Guid.NewGuid(),
        ScholarshipAbstractId = abstractId,
        ScholarshipStatus = live ? 4 : 1,
        StartDate = live ? DateTime.UtcNow.Date.AddDays(-1) : null,
        EndDate   = live ? DateTime.UtcNow.Date.AddDays(30) : null,
        CreatedBy = _sys, CreatedOn = _now, UpdatedBy = _sys, LastModified = _now
    };

    public static Question MakeQuestion(int typeId = 1, int? order = null, string? attrs = null, Guid? id = null) => new()
    {
        QuestionId = id ?? Guid.NewGuid(),
        QuestionDescription = "Test Question",
        QuestionTypeId = typeId,
        QuestionOrder = order,
        QuestionTypeAttributes = attrs,
        CreatedBy = _sys, CreatedOn = _now, UpdatedBy = _sys, LastModified = _now
    };

    public static ScholarshipRequirement MakeRequirement(Guid scholarshipId, Guid questionId,
        int operatorId, string requirementValue, int grouping = 1, Guid? id = null) => new()
    {
        ScholarshipRequirementId = id ?? Guid.NewGuid(),
        ScholarshipId = scholarshipId,
        QuestionId = questionId,
        OperatorId = operatorId,
        RequirementValue = requirementValue,
        Grouping = grouping,
        CreatedBy = _sys, CreatedOn = _now, UpdatedBy = _sys, LastModified = _now
    };

    public static UserScholarship MakeUserScholarship(string email, Guid scholarshipId, int status = 0) => new()
    {
        UserScholarshipsId = Guid.NewGuid(),
        UserEmail = email,
        ScholarshipId = scholarshipId,
        UserScholarshipStatus = status,
        CreatedOn = _now, LastModified = _now
    };

    public static Application MakeApplication(Guid orgId, Guid? id = null) => new()
    {
        ApplicationId = id ?? Guid.NewGuid(),
        OrganizationId = orgId,
        ScholarshipApplicationName = "Test Application",
        CreatedBy = _sys, CreatedOn = _now, UpdatedBy = _sys, LastModified = _now
    };

    public static ApplicationQuestion MakeAppQuestion(Guid appId, Guid questionId, int order = 10, Guid? id = null) => new()
    {
        ApplicationQuestionId = id ?? Guid.NewGuid(),
        ApplicationId = appId,
        QuestionId = questionId,
        Order = order,
        CreatedBy = _sys, CreatedOn = _now, UpdatedBy = _sys, LastModified = _now
    };

    // ── Composite setup helpers ─────────────────────────────────────────

    /// <summary>
    /// Builds: Org → Abstract → Scholarship → Question → Requirement → UserScholarship(status=0).
    /// Returns the ScholarshipId and QuestionId for use in test assertions.
    /// </summary>
    public static async Task<(Guid ScholarshipId, Guid QuestionId)> SetupEligibilityScenario(
        ApplicationDbContext db, string userEmail,
        int questionTypeId, int operatorId, string requirementValue)
    {
        var org = MakeOrg();
        var abs = MakeAbstract(org.OrganizationId);
        var sch = MakeScholarship(abs.ScholarshipAbstractId);
        var q   = MakeQuestion(questionTypeId);
        var req = MakeRequirement(sch.ScholarshipId, q.QuestionId, operatorId, requirementValue);
        var us  = MakeUserScholarship(userEmail, sch.ScholarshipId);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        db.Questions.Add(q);
        db.ScholarshipRequirements.Add(req);
        db.UserScholarships.Add(us);
        await db.SaveChangesAsync();

        return (sch.ScholarshipId, q.QuestionId);
    }

    /// <summary>
    /// Builds a complete live scholarship accessible to a user (for Sync tests).
    /// </summary>
    public static async Task<Guid> SetupLivePublicScholarship(ApplicationDbContext db)
    {
        var org = MakeOrg(isPublic: true);
        var abs = MakeAbstract(org.OrganizationId);
        var sch = MakeScholarship(abs.ScholarshipAbstractId, live: true);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        await db.SaveChangesAsync();

        return sch.ScholarshipId;
    }
}
