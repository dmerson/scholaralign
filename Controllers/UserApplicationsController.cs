using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/user-applications")]
public class UserApplicationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public UserApplicationsController(ApplicationDbContext db) => _db = db;

    // GET /api/user-applications/{userEmail}
    // Returns all eligible scholarships that have an application form linked.
    [HttpGet("{userEmail}")]
    public async Task<IActionResult> GetMyApplications(string userEmail)
    {
        var rows = await (
            from us in _db.UserScholarships
            join s  in _db.Scholarships       on us.ScholarshipId         equals s.ScholarshipId
            join a  in _db.ScholarshipAbstracts on s.ScholarshipAbstractId equals a.ScholarshipAbstractId
            join o  in _db.Organizations       on a.OrganizationId        equals o.OrganizationId
            join app in _db.Applications       on s.ApplicationId         equals app.ApplicationId
            where us.UserEmail == userEmail
               && us.UserScholarshipStatus == 1
               && s.ApplicationId != null
            orderby a.ScholarshipName
            select new
            {
                us.ScholarshipId,
                a.ScholarshipName,
                OrgName          = o.OrganizationName,
                s.Amount,
                s.AmountDescription,
                s.StartDate,
                s.EndDate,
                s.ApplicationId,
                ApplicationName  = app.ScholarshipApplicationName,
                s.AwardYearId
            }
        ).ToListAsync();

        if (rows.Count == 0) return Ok(Array.Empty<object>());

        var appIds = rows.Select(r => r.ApplicationId!.Value).Distinct().ToList();

        var questionCounts = await _db.ApplicationQuestions
            .Where(aq => appIds.Contains(aq.ApplicationId))
            .GroupBy(aq => aq.ApplicationId)
            .Select(g => new { AppId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AppId, x => x.Count);

        var userApps = await _db.UserApplications
            .Where(ua => ua.UserEmail == userEmail && appIds.Contains(ua.ApplicationId))
            .ToDictionaryAsync(ua => ua.ApplicationId);

        return Ok(rows.Select(r =>
        {
            var appId = r.ApplicationId!.Value;
            userApps.TryGetValue(appId, out var ua);
            return new
            {
                r.ScholarshipId,
                r.ScholarshipName,
                r.OrgName,
                r.Amount,
                r.AmountDescription,
                r.StartDate,
                r.EndDate,
                r.ApplicationId,
                r.ApplicationName,
                QuestionCount = questionCounts.GetValueOrDefault(appId, 0),
                IsStarted     = ua != null,
                IsSubmitted   = ua?.SubmittedDate.HasValue == true,
                SubmittedDate = ua?.SubmittedDate
            };
        }));
    }

    // GET /api/user-applications/{userEmail}/{scholarshipId}
    // Returns the application questions and current answers for a specific scholarship.
    [HttpGet("{userEmail}/{scholarshipId:guid}")]
    public async Task<IActionResult> GetDetail(string userEmail, Guid scholarshipId)
    {
        var schol = await (
            from s   in _db.Scholarships
            join a   in _db.ScholarshipAbstracts on s.ScholarshipAbstractId equals a.ScholarshipAbstractId
            join app in _db.Applications         on s.ApplicationId         equals app.ApplicationId
            where s.ScholarshipId == scholarshipId && s.ApplicationId != null
            select new
            {
                s.ScholarshipId,
                a.ScholarshipName,
                s.ApplicationId,
                ApplicationName = app.ScholarshipApplicationName,
                s.AwardYearId
            }
        ).FirstOrDefaultAsync();

        if (schol == null) return NotFound();

        var questions = await (
            from aq in _db.ApplicationQuestions
            join q  in _db.Questions on aq.QuestionId equals q.QuestionId
            where aq.ApplicationId == schol.ApplicationId
            orderby aq.Order
            select new
            {
                aq.ApplicationQuestionId,
                aq.QuestionId,
                q.QuestionDescription,
                q.QuestionTypeId,
                q.QuestionTypeAttributes,
                aq.Order
            }
        ).ToListAsync();

        var userApp = await _db.UserApplications
            .FirstOrDefaultAsync(ua => ua.UserEmail == userEmail && ua.ApplicationId == schol.ApplicationId!.Value);

        var appAnswers = userApp != null
            ? await _db.UserApplicationAnswers
                .Where(uaa => uaa.UserApplicationId == userApp.UserApplicationId)
                .ToDictionaryAsync(uaa => uaa.ApplicationQuestionId)
            : new Dictionary<Guid, UserApplicationAnswer>();

        // Fall back to the user's engine answers for any question not yet answered in this application.
        var questionIds = questions.Select(q => q.QuestionId).ToList();
        var engineAnswers = await _db.Answers
            .Where(a => a.UserEmail == userEmail && questionIds.Contains(a.QuestionId))
            .ToDictionaryAsync(a => a.QuestionId);

        return Ok(new
        {
            schol.ScholarshipId,
            schol.ScholarshipName,
            schol.ApplicationId,
            schol.ApplicationName,
            IsSubmitted   = userApp?.SubmittedDate.HasValue == true,
            SubmittedDate = userApp?.SubmittedDate,
            Questions     = questions.Select(q => new
            {
                q.ApplicationQuestionId,
                q.QuestionId,
                q.QuestionDescription,
                q.QuestionTypeId,
                q.QuestionTypeAttributes,
                q.Order,
                AnswerValue = appAnswers.TryGetValue(q.ApplicationQuestionId, out var appAns)
                    ? appAns.ApplicationAnswerValue
                    : engineAnswers.TryGetValue(q.QuestionId, out var engAns)
                        ? engAns.AnswerValue
                        : null
            })
        });
    }

    // POST /api/user-applications/answer
    [HttpPost("answer")]
    public async Task<IActionResult> SaveAnswer([FromBody] UserAppAnswerReq req)
    {
        var aq = await _db.ApplicationQuestions.FindAsync(req.ApplicationQuestionId);
        if (aq == null) return NotFound("Application question not found.");

        var scholarship = await _db.Scholarships.FindAsync(req.ScholarshipId);
        if (scholarship == null) return NotFound("Scholarship not found.");

        var now    = DateTime.UtcNow;
        var userApp = await _db.UserApplications
            .FirstOrDefaultAsync(ua => ua.UserEmail == req.UserEmail && ua.ApplicationId == aq.ApplicationId);

        if (userApp == null)
        {
            userApp = new UserApplication
            {
                UserApplicationId = Guid.NewGuid(),
                ApplicationId     = aq.ApplicationId,
                AwardYearId       = scholarship.AwardYearId ?? Guid.Empty,
                UserEmail         = req.UserEmail,
                CreatedBy = req.UserEmail, CreatedOn = now,
                UpdatedBy = req.UserEmail, LastModified = now
            };
            _db.UserApplications.Add(userApp);
            await _db.SaveChangesAsync();
        }

        if (userApp.SubmittedDate.HasValue)
            return Conflict("Application has already been submitted.");

        var existing = await _db.UserApplicationAnswers.FirstOrDefaultAsync(
            uaa => uaa.UserApplicationId == userApp.UserApplicationId
                && uaa.ApplicationQuestionId == req.ApplicationQuestionId);

        if (existing != null)
        {
            existing.ApplicationAnswerValue = req.AnswerValue;
            existing.LastModified           = now;
        }
        else
        {
            _db.UserApplicationAnswers.Add(new UserApplicationAnswer
            {
                ScholarshipApplicationAnswerId = Guid.NewGuid(),
                UserApplicationId              = userApp.UserApplicationId,
                ApplicationQuestionId          = req.ApplicationQuestionId,
                ApplicationAnswerValue         = req.AnswerValue,
                CreatedOn    = now,
                LastModified = now
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { saved = true });
    }

    // POST /api/user-applications/submit
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] UserAppSubmitReq req)
    {
        var scholarship = await _db.Scholarships.FindAsync(req.ScholarshipId);
        if (scholarship?.ApplicationId == null) return NotFound();

        var userApp = await _db.UserApplications.FirstOrDefaultAsync(
            ua => ua.UserEmail == req.UserEmail && ua.ApplicationId == scholarship.ApplicationId.Value);

        if (userApp == null) return BadRequest("No answers have been saved yet.");
        if (userApp.SubmittedDate.HasValue) return Conflict("Already submitted.");

        var now              = DateTime.UtcNow;
        userApp.SubmittedDate = now;
        userApp.UpdatedBy    = req.UserEmail;
        userApp.LastModified = now;

        await _db.SaveChangesAsync();
        return Ok(new { submitted = true, submittedDate = now });
    }
}

public record UserAppAnswerReq(string UserEmail, Guid ScholarshipId, Guid ApplicationQuestionId, string AnswerValue);
public record UserAppSubmitReq(string UserEmail, Guid ScholarshipId);
