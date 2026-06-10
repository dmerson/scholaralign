using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Controllers;
using ScholarAlign.Tests.Helpers;

namespace ScholarAlign.Tests.Engine;

/// <summary>
/// Tests the eligibility evaluation logic in EngineController.EvaluateRequirementsAsync()
/// and EvaluateRequirement() indirectly via the SaveAnswer → evaluate pipeline.
///
/// Operator IDs: 1=eq, 2=gt, 3=lt, 4=ne, 5=gte, 6=lte, 7=InList, 8=NotInList
/// Question type IDs: 1=text, 2=integer, 3=decimal, 4=multiselect, 5=radio
/// </summary>
public class EligibilityEvaluatorTests
{
    private const string Email = "student@test.edu";

    // ── Numeric (decimal) comparisons ───────────────────────────────────

    [Fact]
    public async Task Decimal_GTE_PassingAnswer_StatusBecomesEligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 3, operatorId: 5, requirementValue: "3.0"); // GPA >= 3.0

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "3.5"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, us.UserScholarshipStatus);
    }

    [Fact]
    public async Task Decimal_GTE_FailingAnswer_StatusBecomesIneligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 3, operatorId: 5, requirementValue: "3.0");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "2.9"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(-1, us.UserScholarshipStatus);
    }

    [Fact]
    public async Task Decimal_GTE_ExactBoundary_StatusBecomesEligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 3, operatorId: 5, requirementValue: "3.0");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "3.0"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, us.UserScholarshipStatus);
    }

    [Fact]
    public async Task Integer_GT_PassingAnswer_StatusBecomesEligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 2, operatorId: 2, requirementValue: "1000"); // income > 1000

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "5000"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, us.UserScholarshipStatus);
    }

    [Fact]
    public async Task Integer_GT_FailingAnswer_StatusBecomesIneligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 2, operatorId: 2, requirementValue: "1000");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "500"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(-1, us.UserScholarshipStatus);
    }

    // ── No answer → unknown ─────────────────────────────────────────────

    [Fact]
    public async Task NoAnswer_StatusRemainsUnknown()
    {
        using var db = DbHelper.CreateFresh();
        await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 3, operatorId: 5, requirementValue: "3.0");

        // No SaveAnswer call; status stays at 0 (unknown)
        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(0, us.UserScholarshipStatus);
    }

    // ── String equality ─────────────────────────────────────────────────

    [Fact]
    public async Task String_Equal_Match_StatusBecomesEligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 1, operatorId: 1, requirementValue: "Computer Science");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "Computer Science"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, us.UserScholarshipStatus);
    }

    [Fact]
    public async Task String_Equal_NoMatch_StatusBecomesIneligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 1, operatorId: 1, requirementValue: "Computer Science");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "Biology"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(-1, us.UserScholarshipStatus);
    }

    [Fact]
    public async Task String_Equal_CaseInsensitive_Match_StatusBecomesEligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 1, operatorId: 1, requirementValue: "Computer Science");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "COMPUTER SCIENCE"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, us.UserScholarshipStatus);
    }

    // ── InList / NotInList ──────────────────────────────────────────────

    [Fact]
    public async Task InList_AnswerInList_StatusBecomesEligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 5, operatorId: 7, requirementValue: """["Freshman","Sophomore","Junior"]""");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "Freshman"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, us.UserScholarshipStatus);
    }

    [Fact]
    public async Task InList_AnswerNotInList_StatusBecomesIneligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 5, operatorId: 7, requirementValue: """["Freshman","Sophomore"]""");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "Senior"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(-1, us.UserScholarshipStatus);
    }

    [Fact]
    public async Task NotInList_AnswerAbsent_StatusBecomesEligible()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 5, operatorId: 8, requirementValue: """["Part-time","Auditing"]""");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "Full-time"));

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, us.UserScholarshipStatus);
    }

    // ── Multi-requirement (AND within a group) ──────────────────────────

    [Fact]
    public async Task TwoRequirementsInOneGroup_BothPass_StatusEligible()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId);
        var q1  = DbHelper.MakeQuestion(3); // decimal
        var q2  = DbHelper.MakeQuestion(1); // text
        var r1  = DbHelper.MakeRequirement(sch.ScholarshipId, q1.QuestionId, 5, "3.0", grouping: 1);
        var r2  = DbHelper.MakeRequirement(sch.ScholarshipId, q2.QuestionId, 1, "Full-time", grouping: 1);
        var us  = DbHelper.MakeUserScholarship(Email, sch.ScholarshipId);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        db.Questions.AddRange(q1, q2);
        db.ScholarshipRequirements.AddRange(r1, r2);
        db.UserScholarships.Add(us);
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, q1.QuestionId, "3.5"));
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, q2.QuestionId, "Full-time"));

        var final = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, final.UserScholarshipStatus);
    }

    [Fact]
    public async Task TwoRequirementsInOneGroup_OneFails_StatusIneligible()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId);
        var q1  = DbHelper.MakeQuestion(3);
        var q2  = DbHelper.MakeQuestion(1);
        var r1  = DbHelper.MakeRequirement(sch.ScholarshipId, q1.QuestionId, 5, "3.0", grouping: 1);
        var r2  = DbHelper.MakeRequirement(sch.ScholarshipId, q2.QuestionId, 1, "Full-time", grouping: 1);
        var us  = DbHelper.MakeUserScholarship(Email, sch.ScholarshipId);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        db.Questions.AddRange(q1, q2);
        db.ScholarshipRequirements.AddRange(r1, r2);
        db.UserScholarships.Add(us);
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, q1.QuestionId, "2.5")); // fail
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, q2.QuestionId, "Full-time")); // pass

        var final = await db.UserScholarships.FirstAsync();
        Assert.Equal(-1, final.UserScholarshipStatus);
    }

    // ── Multi-group (OR between groups) ─────────────────────────────────

    [Fact]
    public async Task TwoGroups_OneFailsOnePassess_StatusEligible()
    {
        using var db = DbHelper.CreateFresh();
        var org = DbHelper.MakeOrg();
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId);
        var q1  = DbHelper.MakeQuestion(1); // major
        var q2  = DbHelper.MakeQuestion(3); // GPA
        // Group 1: major = "Art" (will fail: user is CS)
        // Group 2: GPA >= 3.0 (will pass)
        var r1  = DbHelper.MakeRequirement(sch.ScholarshipId, q1.QuestionId, 1, "Art",    grouping: 1);
        var r2  = DbHelper.MakeRequirement(sch.ScholarshipId, q2.QuestionId, 5, "3.0",   grouping: 2);
        var us  = DbHelper.MakeUserScholarship(Email, sch.ScholarshipId);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        db.Questions.AddRange(q1, q2);
        db.ScholarshipRequirements.AddRange(r1, r2);
        db.UserScholarships.Add(us);
        await db.SaveChangesAsync();

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, q1.QuestionId, "Computer Science")); // fails group 1
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, q2.QuestionId, "3.8")); // passes group 2

        var final = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, final.UserScholarshipStatus);
    }

    // ── No requirements → eligible ───────────────────────────────────────

    [Fact]
    public async Task NoRequirements_AfterSync_StatusIsEligible()
    {
        using var db = DbHelper.CreateFresh();
        // Scholarship with no requirements — after evaluation it should be eligible (no hurdles)
        var org = DbHelper.MakeOrg();
        var abs = DbHelper.MakeAbstract(org.OrganizationId);
        var sch = DbHelper.MakeScholarship(abs.ScholarshipAbstractId, live: true);
        var us  = DbHelper.MakeUserScholarship(Email, sch.ScholarshipId);

        db.Organizations.Add(org);
        db.ScholarshipAbstracts.Add(abs);
        db.Scholarships.Add(sch);
        db.UserScholarships.Add(us);
        await db.SaveChangesAsync();

        // Trigger evaluation by saving a dummy answer to some other question
        // (affecting this scholarship is the key — but since it has no requirements, just trigger sync)
        var ctrl = new EngineController(db);
        await ctrl.Sync(new EngineSyncRequest(Email));

        var final = await db.UserScholarships.FirstAsync();
        // No requirements → eligible by availability alone
        Assert.Equal(1, final.UserScholarshipStatus);
    }

    // ── SaveAnswer returns 400 on bad input ──────────────────────────────

    [Fact]
    public async Task SaveAnswer_EmptyEmail_ReturnsBadRequest()
    {
        using var db = DbHelper.CreateFresh();
        var ctrl = new EngineController(db);
        var result = await ctrl.SaveAnswer(new EngineAnswerRequest("", Guid.NewGuid(), "value"));
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task SaveAnswer_EmptyGuid_ReturnsBadRequest()
    {
        using var db = DbHelper.CreateFresh();
        var ctrl = new EngineController(db);
        var result = await ctrl.SaveAnswer(new EngineAnswerRequest(Email, Guid.Empty, "value"));
        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── Upsert: updating an existing answer ─────────────────────────────

    [Fact]
    public async Task SaveAnswer_Twice_UpsertsSameAnswerRecord()
    {
        using var db = DbHelper.CreateFresh();
        var (_, qId) = await DbHelper.SetupEligibilityScenario(db, Email,
            questionTypeId: 3, operatorId: 5, requirementValue: "3.0");

        var ctrl = new EngineController(db);
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "2.5")); // ineligible
        await ctrl.SaveAnswer(new EngineAnswerRequest(Email, qId, "3.5")); // now eligible

        // Only one answer record should exist
        var answerCount = await db.Answers.CountAsync();
        Assert.Equal(1, answerCount);

        var us = await db.UserScholarships.FirstAsync();
        Assert.Equal(1, us.UserScholarshipStatus);
    }
}
