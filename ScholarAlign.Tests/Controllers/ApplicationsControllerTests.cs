using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Controllers;
using ScholarAlign.Tests.Helpers;

namespace ScholarAlign.Tests.Controllers;

public class ApplicationsControllerTests
{
    private static ApplicationsController MakeController(ScholarAlign.Data.ApplicationDbContext db)
    {
        var ctrl = new ApplicationsController(db);
        ctrl.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        return ctrl;
    }

    // ── AdminGetAll ──────────────────────────────────────────────────────

    [Fact]
    public async Task AdminGetAll_EmptyDb_ReturnsEmptyList()
    {
        using var db = DbHelper.CreateFresh();
        var ctrl = MakeController(db);
        var result = await ctrl.AdminGetAll(null) as OkObjectResult;
        Assert.NotNull(result);
        var list = result.Value as IEnumerable<object>;
        Assert.Empty(list!);
    }

    [Fact]
    public async Task AdminGetAll_ReturnsApplicationWithOrgName()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var app = DbHelper.MakeApplication(org.OrganizationId);
        db.Organizations.Add(org);
        db.Applications.Add(app);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        var result = await ctrl.AdminGetAll(null) as OkObjectResult;
        var list = (result!.Value as IEnumerable<object>)!.ToList();
        Assert.Single(list);
    }

    [Fact]
    public async Task AdminGetAll_FiltersByOrganizationId()
    {
        using var db = DbHelper.CreateFresh();
        var org1 = DbHelper.MakeOrg();
        var org2 = DbHelper.MakeOrg();
        var app1 = DbHelper.MakeApplication(org1.OrganizationId);
        var app2 = DbHelper.MakeApplication(org2.OrganizationId);
        db.Organizations.AddRange(org1, org2);
        db.Applications.AddRange(app1, app2);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        var result = await ctrl.AdminGetAll(org1.OrganizationId) as OkObjectResult;
        var list = (result!.Value as IEnumerable<object>)!.ToList();
        Assert.Single(list);
    }

    // ── AdminCreate ──────────────────────────────────────────────────────

    [Fact]
    public async Task AdminCreate_AddsApplicationToDb()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        var req = new AppRequest("Scholarship App 2026", org.OrganizationId, null);
        var result = await ctrl.AdminCreate(req);

        Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(1, await db.Applications.CountAsync());
    }

    [Fact]
    public async Task AdminCreate_SetsAuditFieldsAndReturnsSummary()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        await ctrl.AdminCreate(new AppRequest("My App", org.OrganizationId, null));

        var app = await db.Applications.FirstAsync();
        Assert.Equal("My App", app.ScholarshipApplicationName);
        Assert.Equal(org.OrganizationId, app.OrganizationId);
    }

    // ── AdminUpdate ──────────────────────────────────────────────────────

    [Fact]
    public async Task AdminUpdate_ChangesName()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var app = DbHelper.MakeApplication(org.OrganizationId);
        db.Organizations.Add(org);
        db.Applications.Add(app);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        await ctrl.AdminUpdate(app.ApplicationId, new AppRequest("Updated Name", org.OrganizationId, null));

        var updated = await db.Applications.FindAsync(app.ApplicationId);
        Assert.Equal("Updated Name", updated!.ScholarshipApplicationName);
    }

    [Fact]
    public async Task AdminUpdate_NonExistentId_ReturnsNotFound()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        var result = await ctrl.AdminUpdate(Guid.NewGuid(), new AppRequest("X", org.OrganizationId, null));
        Assert.IsType<NotFoundResult>(result);
    }

    // ── AdminDelete ──────────────────────────────────────────────────────

    [Fact]
    public async Task AdminDelete_RemovesApplication()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var app = DbHelper.MakeApplication(org.OrganizationId);
        db.Organizations.Add(org);
        db.Applications.Add(app);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        await ctrl.AdminDelete(app.ApplicationId);

        Assert.Equal(0, await db.Applications.CountAsync());
    }

    [Fact]
    public async Task AdminDelete_BlockedWhenLinkedToScholarship()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var app = DbHelper.MakeApplication(org.OrganizationId);
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId);
        sch.ApplicationId = app.ApplicationId;

        db.Organizations.Add(org);
        db.Applications.Add(app);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        var result = await ctrl.AdminDelete(app.ApplicationId);
        Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(1, await db.Applications.CountAsync()); // not deleted
    }

    // ── Question management ──────────────────────────────────────────────

    [Fact]
    public async Task GetQuestions_ReturnsQuestionsForApplication()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var app = DbHelper.MakeApplication(org.OrganizationId);
        var q   = DbHelper.MakeQuestion(3);
        var aq  = DbHelper.MakeAppQuestion(app.ApplicationId, q.QuestionId, order: 10);
        db.QuestionTypes.Add(new ScholarAlign.Models.QuestionType
            { QuestionTypeId = 3, QuestionTypeDescription = "Decimal" });
        db.Organizations.Add(org);
        db.Applications.Add(app);
        db.Questions.Add(q);
        db.ApplicationQuestions.Add(aq);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        var result = await ctrl.GetQuestions(app.ApplicationId) as OkObjectResult;
        var list = (result!.Value as IEnumerable<object>)!.ToList();
        Assert.Single(list);
    }

    [Fact]
    public async Task AddQuestion_AddsToApplication()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var app = DbHelper.MakeApplication(org.OrganizationId);
        var q   = DbHelper.MakeQuestion(1);
        db.Organizations.Add(org);
        db.Applications.Add(app);
        db.Questions.Add(q);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        await ctrl.AddQuestion(app.ApplicationId, new AppQuestionRequest(q.QuestionId, 10));

        Assert.Equal(1, await db.ApplicationQuestions.CountAsync());
    }

    [Fact]
    public async Task RemoveQuestion_RemovesFromApplication()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var app = DbHelper.MakeApplication(org.OrganizationId);
        var q   = DbHelper.MakeQuestion(1);
        var aq  = DbHelper.MakeAppQuestion(app.ApplicationId, q.QuestionId);
        db.Organizations.Add(org);
        db.Applications.Add(app);
        db.Questions.Add(q);
        db.ApplicationQuestions.Add(aq);
        await db.SaveChangesAsync();

        var ctrl = MakeController(db);
        await ctrl.RemoveQuestion(app.ApplicationId, aq.ApplicationQuestionId);

        Assert.Equal(0, await db.ApplicationQuestions.CountAsync());
    }
}
