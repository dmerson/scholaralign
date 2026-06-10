using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequirementsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public RequirementsController(ApplicationDbContext db) => _db = db;

    [HttpGet("operators")]
    public async Task<IActionResult> GetOperators() =>
        Ok(await _db.Operators.OrderBy(o => o.OperatorId).ToListAsync());

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid scholarshipId)
    {
        var reqs = await _db.ScholarshipRequirements
            .Where(r => r.ScholarshipId == scholarshipId)
            .Join(_db.Questions, r => r.QuestionId, q => q.QuestionId,
                (r, q) => new { r, q.QuestionDescription, q.QuestionTypeId, q.QuestionTypeAttributes })
            .Join(_db.Operators, x => x.r.OperatorId, o => o.OperatorId,
                (x, o) => new
                {
                    x.r.ScholarshipRequirementId,
                    x.r.ScholarshipId,
                    x.r.QuestionId,
                    x.QuestionDescription,
                    x.QuestionTypeId,
                    x.QuestionTypeAttributes,
                    x.r.OperatorId,
                    o.OperatorShownName,
                    x.r.RequirementValue,
                    x.r.Grouping
                })
            .OrderBy(x => x.Grouping).ThenBy(x => x.QuestionDescription)
            .ToListAsync();
        return Ok(reqs);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var r = await _db.ScholarshipRequirements.FindAsync(id);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] RequirementRequest req)
    {
        var entity = new ScholarshipRequirement
        {
            ScholarshipRequirementId = Guid.NewGuid(),
            ScholarshipId = req.ScholarshipId,
            QuestionId = req.QuestionId,
            OperatorId = req.OperatorId,
            RequirementValue = req.RequirementValue,
            Grouping = req.Grouping,
            CreatedBy = User.Identity?.Name ?? "system",
            CreatedOn = DateTime.UtcNow,
            UpdatedBy = User.Identity?.Name ?? "system",
            LastModified = DateTime.UtcNow
        };
        _db.ScholarshipRequirements.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new { entity.ScholarshipRequirementId });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] RequirementRequest req)
    {
        var entity = await _db.ScholarshipRequirements.FindAsync(id);
        if (entity is null) return NotFound();
        entity.QuestionId = req.QuestionId;
        entity.OperatorId = req.OperatorId;
        entity.RequirementValue = req.RequirementValue;
        entity.Grouping = req.Grouping;
        entity.UpdatedBy = User.Identity?.Name ?? "system";
        entity.LastModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.ScholarshipRequirements.FindAsync(id);
        if (entity is null) return NotFound();
        _db.ScholarshipRequirements.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record RequirementRequest(Guid ScholarshipId, Guid QuestionId, int OperatorId, string RequirementValue, int Grouping);
