using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApplicationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ApplicationsController(ApplicationDbContext db) => _db = db;

    // ── Admin: Application CRUD ─────────────────────────────────────────────

    [HttpGet("admin")]
    public async Task<IActionResult> AdminGetAll([FromQuery] Guid? organizationId)
    {
        var query = from a in _db.Applications
                    join o in _db.Organizations on a.OrganizationId equals o.OrganizationId
                    join so in _db.SubOrganizations on a.SubOrganizationId equals so.SubOrganizationId into soJoin
                    from so in soJoin.DefaultIfEmpty()
                    where !organizationId.HasValue || a.OrganizationId == organizationId.Value
                    orderby a.ScholarshipApplicationName
                    select new
                    {
                        a.ApplicationId,
                        a.ScholarshipApplicationName,
                        a.OrganizationId,
                        OrgName = o.OrganizationName,
                        a.SubOrganizationId,
                        SubOrgName = so != null ? so.SubOrganizationName : null,
                        QuestionCount = _db.ApplicationQuestions.Count(q => q.ApplicationId == a.ApplicationId)
                    };
        return Ok(await query.ToListAsync());
    }

    [HttpGet("admin/{id:guid}")]
    public async Task<IActionResult> AdminGetById(Guid id)
    {
        var result = await (from a in _db.Applications
                            join o in _db.Organizations on a.OrganizationId equals o.OrganizationId
                            join so in _db.SubOrganizations on a.SubOrganizationId equals so.SubOrganizationId into soJoin
                            from so in soJoin.DefaultIfEmpty()
                            where a.ApplicationId == id
                            select new
                            {
                                a.ApplicationId,
                                a.ScholarshipApplicationName,
                                a.OrganizationId,
                                OrgName = o.OrganizationName,
                                a.SubOrganizationId,
                                SubOrgName = so != null ? so.SubOrganizationName : null
                            }).FirstOrDefaultAsync();
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("admin")]
    public async Task<IActionResult> AdminCreate([FromBody] AppRequest req)
    {
        var actor = User.Identity?.Name ?? "system";
        var now = DateTime.UtcNow;
        var app = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ScholarshipApplicationName = req.ScholarshipApplicationName,
            OrganizationId = req.OrganizationId,
            SubOrganizationId = req.SubOrganizationId,
            CreatedBy = actor, CreatedOn = now, UpdatedBy = actor, LastModified = now
        };
        _db.Applications.Add(app);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(AdminGetById), new { id = app.ApplicationId }, new { app.ApplicationId });
    }

    [HttpPut("admin/{id:guid}")]
    public async Task<IActionResult> AdminUpdate(Guid id, [FromBody] AppRequest req)
    {
        var app = await _db.Applications.FindAsync(id);
        if (app is null) return NotFound();
        app.ScholarshipApplicationName = req.ScholarshipApplicationName;
        app.OrganizationId = req.OrganizationId;
        app.SubOrganizationId = req.SubOrganizationId;
        app.UpdatedBy = User.Identity?.Name ?? "system";
        app.LastModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { app.ApplicationId });
    }

    [HttpDelete("admin/{id:guid}")]
    public async Task<IActionResult> AdminDelete(Guid id)
    {
        var app = await _db.Applications.FindAsync(id);
        if (app is null) return NotFound();
        if (await _db.Scholarships.AnyAsync(s => s.ApplicationId == id))
            return Conflict("This application is linked to one or more scholarships and cannot be deleted.");
        var questions = await _db.ApplicationQuestions.Where(q => q.ApplicationId == id).ToListAsync();
        _db.ApplicationQuestions.RemoveRange(questions);
        _db.Applications.Remove(app);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Admin: Application Questions ────────────────────────────────────────

    [HttpGet("admin/{id:guid}/questions")]
    public async Task<IActionResult> GetQuestions(Guid id)
    {
        var questions = await (from aq in _db.ApplicationQuestions
                               join q in _db.Questions on aq.QuestionId equals q.QuestionId
                               join qt in _db.QuestionTypes on q.QuestionTypeId equals qt.QuestionTypeId
                               where aq.ApplicationId == id
                               orderby aq.Order
                               select new
                               {
                                   aq.ApplicationQuestionId,
                                   aq.ApplicationId,
                                   aq.QuestionId,
                                   q.QuestionDescription,
                                   q.QuestionTypeId,
                                   QuestionTypeDescription = qt.QuestionTypeDescription,
                                   aq.Order
                               }).ToListAsync();
        return Ok(questions);
    }

    [HttpPost("admin/{id:guid}/questions")]
    public async Task<IActionResult> AddQuestion(Guid id, [FromBody] AppQuestionRequest req)
    {
        if (!await _db.Applications.AnyAsync(a => a.ApplicationId == id)) return NotFound();
        var actor = User.Identity?.Name ?? "system";
        var now = DateTime.UtcNow;
        var aq = new ApplicationQuestion
        {
            ApplicationQuestionId = Guid.NewGuid(),
            ApplicationId = id,
            QuestionId = req.QuestionId,
            Order = req.Order,
            CreatedBy = actor, CreatedOn = now, UpdatedBy = actor, LastModified = now
        };
        _db.ApplicationQuestions.Add(aq);
        await _db.SaveChangesAsync();
        return Created($"/api/applications/admin/{id}/questions/{aq.ApplicationQuestionId}",
            new { aq.ApplicationQuestionId });
    }

    [HttpPut("admin/{id:guid}/questions/{aqId:guid}")]
    public async Task<IActionResult> UpdateQuestion(Guid id, Guid aqId, [FromBody] AppQuestionOrderRequest req)
    {
        var aq = await _db.ApplicationQuestions
            .FirstOrDefaultAsync(q => q.ApplicationQuestionId == aqId && q.ApplicationId == id);
        if (aq is null) return NotFound();
        aq.Order = req.Order;
        aq.UpdatedBy = User.Identity?.Name ?? "system";
        aq.LastModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { aq.ApplicationQuestionId });
    }

    [HttpDelete("admin/{id:guid}/questions/{aqId:guid}")]
    public async Task<IActionResult> RemoveQuestion(Guid id, Guid aqId)
    {
        var aq = await _db.ApplicationQuestions
            .FirstOrDefaultAsync(q => q.ApplicationQuestionId == aqId && q.ApplicationId == id);
        if (aq is null) return NotFound();
        _db.ApplicationQuestions.Remove(aq);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record AppRequest(
    string ScholarshipApplicationName,
    Guid OrganizationId,
    Guid? SubOrganizationId
);

public record AppQuestionRequest(Guid QuestionId, int Order);

public record AppQuestionOrderRequest(int Order);
