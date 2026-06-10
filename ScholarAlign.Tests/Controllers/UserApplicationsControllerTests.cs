using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Controllers;
using ScholarAlign.Tests.Helpers;

namespace ScholarAlign.Tests.Controllers;

public class UserApplicationsControllerTests
{
    private const string Email = "student@test.edu";

    // ── Helper: set up scholarship with linked application + question ────

    private static async Task<(Guid ScholarshipId, Guid AppId, Guid AqId)> SetupScholarshipWithApp(
        ScholarAlign.Data.ApplicationDbContext db)
    {
        var org = DbHelper.MakeOrg();
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId);
        var app = DbHelper.MakeApplication(org.OrganizationId);
        var q   = DbHelper.MakeQuestion(1);
        var aq  = DbHelper.MakeAppQuestion(app.ApplicationId, q.QuestionId, order: 10);
        sch.ApplicationId = app.ApplicationId;

        var us = DbHelper.MakeUserScholarship(Email, sch.ScholarshipId, status: 1);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        db.Applications.Add(app);
        db.Questions.Add(q);
        db.ApplicationQuestions.Add(aq);
        db.UserScholarships.Add(us);
        await db.SaveChangesAsync();

        return (sch.ScholarshipId, app.ApplicationId, aq.ApplicationQuestionId);
    }

    // ── GetMyApplications ────────────────────────────────────────────────

    [Fact]
    public async Task GetMyApplications_NoEligibleScholarships_ReturnsEmpty()
    {
        using var db = DbHelper.CreateFresh();
        var ctrl = new UserApplicationsController(db);
        var result = await ctrl.GetMyApplications(Email) as OkObjectResult;
        Assert.NotNull(result);
        var items = result.Value as IEnumerable<object>;
        Assert.Empty(items!);
    }

    [Fact]
    public async Task GetMyApplications_ReturnsEligibleScholarshipsWithApp()
    {
        using var db = DbHelper.CreateFresh();
        await SetupScholarshipWithApp(db);

        var ctrl = new UserApplicationsController(db);
        var result = await ctrl.GetMyApplications(Email) as OkObjectResult;
        var items = (result!.Value as IEnumerable<object>)!.ToList();
        Assert.Single(items);
    }

    [Fact]
    public async Task GetMyApplications_ExcludesIneligibleScholarships()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId);
        var app = DbHelper.MakeApplication(org.OrganizationId);
        sch.ApplicationId = app.ApplicationId;
        // ineligible (-1)
        var us = DbHelper.MakeUserScholarship(Email, sch.ScholarshipId, status: -1);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        db.Applications.Add(app);
        db.UserScholarships.Add(us);
        await db.SaveChangesAsync();

        var ctrl = new UserApplicationsController(db);
        var result = await ctrl.GetMyApplications(Email) as OkObjectResult;
        var items = (result!.Value as IEnumerable<object>)!;
        Assert.Empty(items);
    }

    // ── GetDetail ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetDetail_ReturnsScholarshipAndQuestions()
    {
        using var db = DbHelper.CreateFresh();
        var (scholId, _, _) = await SetupScholarshipWithApp(db);

        var ctrl = new UserApplicationsController(db);
        var result = await ctrl.GetDetail(Email, scholId) as OkObjectResult;
        Assert.NotNull(result);

        var questionsProperty = result.Value?.GetType().GetProperty("Questions")?.GetValue(result.Value)
            as IEnumerable<object>;
        Assert.Single(questionsProperty!);
    }

    [Fact]
    public async Task GetDetail_NonExistentScholarship_ReturnsNotFound()
    {
        using var db = DbHelper.CreateFresh();
        var ctrl = new UserApplicationsController(db);
        var result = await ctrl.GetDetail(Email, Guid.NewGuid());
        Assert.IsType<NotFoundResult>(result);
    }

    // ── SaveAnswer ───────────────────────────────────────────────────────

    [Fact]
    public async Task SaveAnswer_CreatesUserApplicationAndAnswer()
    {
        using var db = DbHelper.CreateFresh();
        var (scholId, _, aqId) = await SetupScholarshipWithApp(db);

        var ctrl = new UserApplicationsController(db);
        var result = await ctrl.SaveAnswer(
            new UserAppAnswerReq(Email, scholId, aqId, "Computer Science")) as OkObjectResult;

        Assert.NotNull(result);
        Assert.Equal(1, await db.UserApplications.CountAsync());
        Assert.Equal(1, await db.UserApplicationAnswers.CountAsync());
    }

    [Fact]
    public async Task SaveAnswer_UpdatesExistingAnswer()
    {
        using var db = DbHelper.CreateFresh();
        var (scholId, _, aqId) = await SetupScholarshipWithApp(db);

        var ctrl = new UserApplicationsController(db);
        await ctrl.SaveAnswer(new UserAppAnswerReq(Email, scholId, aqId, "First"));
        await ctrl.SaveAnswer(new UserAppAnswerReq(Email, scholId, aqId, "Updated"));

        Assert.Equal(1, await db.UserApplicationAnswers.CountAsync()); // upsert, not duplicate
        var ans = await db.UserApplicationAnswers.FirstAsync();
        Assert.Equal("Updated", ans.ApplicationAnswerValue);
    }

    [Fact]
    public async Task SaveAnswer_AfterSubmit_ReturnsConflict()
    {
        using var db = DbHelper.CreateFresh();
        var (scholId, appId, aqId) = await SetupScholarshipWithApp(db);

        // Save and submit first
        var ctrl = new UserApplicationsController(db);
        await ctrl.SaveAnswer(new UserAppAnswerReq(Email, scholId, aqId, "yes"));
        await ctrl.Submit(new UserAppSubmitReq(Email, scholId));

        // Attempt to save again
        var result = await ctrl.SaveAnswer(new UserAppAnswerReq(Email, scholId, aqId, "no"));
        Assert.IsType<ConflictObjectResult>(result);
    }

    // ── Submit ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Submit_SetsSubmittedDate()
    {
        using var db = DbHelper.CreateFresh();
        var (scholId, _, aqId) = await SetupScholarshipWithApp(db);

        var ctrl = new UserApplicationsController(db);
        await ctrl.SaveAnswer(new UserAppAnswerReq(Email, scholId, aqId, "yes"));
        await ctrl.Submit(new UserAppSubmitReq(Email, scholId));

        var ua = await db.UserApplications.FirstAsync();
        Assert.True(ua.SubmittedDate.HasValue);
    }

    [Fact]
    public async Task Submit_WithNoSavedAnswers_ReturnsBadRequest()
    {
        using var db = DbHelper.CreateFresh();
        var (scholId, _, _) = await SetupScholarshipWithApp(db);

        var ctrl = new UserApplicationsController(db);
        var result = await ctrl.Submit(new UserAppSubmitReq(Email, scholId));
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Submit_AlreadySubmitted_ReturnsConflict()
    {
        using var db = DbHelper.CreateFresh();
        var (scholId, _, aqId) = await SetupScholarshipWithApp(db);

        var ctrl = new UserApplicationsController(db);
        await ctrl.SaveAnswer(new UserAppAnswerReq(Email, scholId, aqId, "yes"));
        await ctrl.Submit(new UserAppSubmitReq(Email, scholId));
        var result = await ctrl.Submit(new UserAppSubmitReq(Email, scholId));
        Assert.IsType<ConflictObjectResult>(result);
    }

    // ── Pre-fill from engine answers ─────────────────────────────────────

    [Fact]
    public async Task GetDetail_PreFillsAnswerFromEngineAnswers()
    {
        using var db = DbHelper.CreateFresh();
        var (scholId, _, aqId) = await SetupScholarshipWithApp(db);

        // Add an engine-level answer for the underlying question
        var aq = await db.ApplicationQuestions.FindAsync(aqId);
        db.Answers.Add(new ScholarAlign.Models.Answer
        {
            AnswerId = Guid.NewGuid(),
            QuestionId = aq!.QuestionId,
            UserEmail = Email,
            AnswerValue = "Pre-filled from wizard",
            CreatedOn = DateTime.UtcNow,
            LastModified = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var ctrl = new UserApplicationsController(db);
        var result = await ctrl.GetDetail(Email, scholId) as OkObjectResult;
        Assert.NotNull(result);

        // Extract AnswerValue from the first question in the response
        var questions = result.Value?.GetType()
            .GetProperty("Questions")?.GetValue(result.Value) as IEnumerable<object>;
        var firstQ = questions?.First();
        var answerValue = firstQ?.GetType().GetProperty("AnswerValue")?.GetValue(firstQ) as string;
        Assert.Equal("Pre-filled from wizard", answerValue);
    }
}
