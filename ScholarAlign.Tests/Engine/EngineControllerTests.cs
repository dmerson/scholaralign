using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Controllers;
using ScholarAlign.Tests.Helpers;

namespace ScholarAlign.Tests.Engine;

public class EngineControllerTests
{
    private const string Email = "student@test.edu";

    // ── Sync ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Sync_CreatesUserScholarshipForLivePublicScholarship()
    {
        using var db = DbHelper.CreateFresh();
        await DbHelper.SetupLivePublicScholarship(db);

        var ctrl = new EngineController(db);
        var result = await ctrl.Sync(new EngineSyncRequest(Email)) as OkObjectResult;

        Assert.NotNull(result);
        var us = await db.UserScholarships.FirstOrDefaultAsync();
        Assert.NotNull(us);
        Assert.Equal(Email, us.UserEmail);
        Assert.Equal(1, us.UserScholarshipStatus); // no requirements → immediately eligible
    }

    [Fact]
    public async Task Sync_DoesNotDuplicateExistingUserScholarship()
    {
        using var db = DbHelper.CreateFresh();
        var scholId = await DbHelper.SetupLivePublicScholarship(db);
        db.UserScholarships.Add(DbHelper.MakeUserScholarship(Email, scholId, status: 1));
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        await ctrl.Sync(new EngineSyncRequest(Email));

        var count = await db.UserScholarships.CountAsync();
        Assert.Equal(1, count); // no duplicate
    }

    [Fact]
    public async Task Sync_ExcludesExpiredScholarship()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg(isPublic: true);
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId, live: false);
        sch.ScholarshipStatus = 4;
        sch.StartDate = DateTime.UtcNow.Date.AddDays(-60);
        sch.EndDate   = DateTime.UtcNow.Date.AddDays(-1); // expired yesterday

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        await ctrl.Sync(new EngineSyncRequest(Email));

        var count = await db.UserScholarships.CountAsync();
        Assert.Equal(0, count); // expired scholarship is ignored
    }

    [Fact]
    public async Task Sync_ReturnsOkWithSyncedTrue()
    {
        using var db = DbHelper.CreateFresh();
        var ctrl = new EngineController(db);
        var result = await ctrl.Sync(new EngineSyncRequest(Email)) as OkObjectResult;
        Assert.NotNull(result);
        // Value is an anonymous type {synced = true} — check via reflection
        var synced = result.Value?.GetType().GetProperty("synced")?.GetValue(result.Value);
        Assert.Equal(true, synced);
    }

    [Fact]
    public async Task Sync_EmptyEmail_ReturnsBadRequest()
    {
        using var db = DbHelper.CreateFresh();
        var ctrl = new EngineController(db);
        var result = await ctrl.Sync(new EngineSyncRequest(""));
        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── GetNextQuestion ──────────────────────────────────────────────────

    [Fact]
    public async Task GetNextQuestion_NoUnknownScholarships_ReturnsNull()
    {
        using var db = DbHelper.CreateFresh();
        var ctrl = new EngineController(db);
        var result = await ctrl.GetNextQuestion(Email) as OkObjectResult;
        Assert.NotNull(result);
        Assert.Null(result.Value);
    }

    [Fact]
    public async Task GetNextQuestion_AllQuestionsAnswered_ReturnsNull()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 1, operatorId: 1, requirementValue: "yes");

        // Answer the question
        db.Answers.Add(new ScholarAlign.Models.Answer
        {
            AnswerId = Guid.NewGuid(),
            QuestionId = qId,
            UserEmail = Email,
            AnswerValue = "yes",
            CreatedOn = DateTime.UtcNow,
            LastModified = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        var result = await ctrl.GetNextQuestion(Email) as OkObjectResult;
        Assert.NotNull(result);
        Assert.Null(result.Value); // all answered
    }

    [Fact]
    public async Task GetNextQuestion_UnansweredQuestion_ReturnsIt()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 3, operatorId: 5, requirementValue: "3.0");

        var ctrl = new EngineController(db);
        var result = await ctrl.GetNextQuestion(Email) as OkObjectResult;
        Assert.NotNull(result);

        var q = result.Value as ScholarAlign.Models.Question;
        Assert.NotNull(q);
        Assert.Equal(qId, q.QuestionId);
    }

    [Fact]
    public async Task GetNextQuestion_PrioritisesLowestQuestionOrder()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId);
        var q1  = DbHelper.MakeQuestion(1, order: 20);
        var q2  = DbHelper.MakeQuestion(1, order: 5);  // lower order → should come first
        var r1  = DbHelper.MakeRequirement(sch.ScholarshipId, q1.QuestionId, 1, "A");
        var r2  = DbHelper.MakeRequirement(sch.ScholarshipId, q2.QuestionId, 1, "B");
        var us  = DbHelper.MakeUserScholarship(Email, sch.ScholarshipId);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        db.Questions.AddRange(q1, q2);
        db.ScholarshipRequirements.AddRange(r1, r2);
        db.UserScholarships.Add(us);
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        var result = await ctrl.GetNextQuestion(Email) as OkObjectResult;
        var q = result!.Value as ScholarAlign.Models.Question;
        Assert.Equal(q2.QuestionId, q!.QuestionId); // order 5 wins
    }

    // ── GetMyAnswers ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetMyAnswers_ReturnsAnswersWithQuestionInfo()
    {
        using var db = DbHelper.CreateFresh();
        var q = DbHelper.MakeQuestion(3);
        db.Questions.Add(q);
        db.Answers.Add(new ScholarAlign.Models.Answer
        {
            AnswerId = Guid.NewGuid(),
            QuestionId = q.QuestionId,
            UserEmail = Email,
            AnswerValue = "3.8",
            CreatedOn = DateTime.UtcNow,
            LastModified = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        var result = await ctrl.GetMyAnswers(Email) as OkObjectResult;
        Assert.NotNull(result);

        // Result is a list of anonymous objects — check via reflection
        var items = result.Value as IEnumerable<object>;
        Assert.NotNull(items);
        Assert.Single(items);
    }

    [Fact]
    public async Task GetMyAnswers_OtherUsersAnswersNotReturned()
    {
        using var db = DbHelper.CreateFresh();
        var q = DbHelper.MakeQuestion(1);
        db.Questions.Add(q);
        db.Answers.Add(new ScholarAlign.Models.Answer
        {
            AnswerId = Guid.NewGuid(),
            QuestionId = q.QuestionId,
            UserEmail = "other@test.edu",
            AnswerValue = "CS",
            CreatedOn = DateTime.UtcNow,
            LastModified = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        var result = await ctrl.GetMyAnswers(Email) as OkObjectResult;
        var items = result!.Value as IEnumerable<object>;
        Assert.Empty(items!);
    }
}
