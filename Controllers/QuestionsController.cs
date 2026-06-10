using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuestionsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public QuestionsController(ApplicationDbContext db) => _db = db;

    [HttpGet("types")]
    public async Task<IActionResult> GetTypes()
        => Ok(await _db.QuestionTypes.OrderBy(t => t.QuestionTypeId).ToListAsync());

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Questions
            .OrderBy(q => q.QuestionOrder ?? int.MaxValue)
            .ThenBy(q => q.QuestionDescription)
            .Select(q => new
            {
                q.QuestionId,
                q.QuestionDescription,
                q.QuestionTypeId,
                QuestionTypeName = _db.QuestionTypes
                    .Where(t => t.QuestionTypeId == q.QuestionTypeId)
                    .Select(t => t.QuestionTypeDescription)
                    .FirstOrDefault(),
                q.QuestionOrder,
                q.QuestionTypeAttributes,
                q.CreatedBy,
                q.CreatedOn,
                q.UpdatedBy,
                q.LastModified
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var q = await _db.Questions.FindAsync(id);
        return q is null ? NotFound() : Ok(q);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuestionRequest req)
    {
        var q = new Question
        {
            QuestionId = Guid.NewGuid(),
            QuestionDescription = req.QuestionDescription,
            QuestionTypeId = req.QuestionTypeId,
            QuestionOrder = req.QuestionOrder,
            QuestionTypeAttributes = req.QuestionTypeAttributes,
            CreatedBy = User.Identity?.Name ?? "system",
            CreatedOn = DateTime.UtcNow,
            UpdatedBy = User.Identity?.Name ?? "system",
            LastModified = DateTime.UtcNow
        };
        _db.Questions.Add(q);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = q.QuestionId }, q);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] QuestionRequest req)
    {
        var q = await _db.Questions.FindAsync(id);
        if (q is null) return NotFound();
        q.QuestionDescription = req.QuestionDescription;
        q.QuestionTypeId = req.QuestionTypeId;
        q.QuestionOrder = req.QuestionOrder;
        q.QuestionTypeAttributes = req.QuestionTypeAttributes;
        q.UpdatedBy = User.Identity?.Name ?? "system";
        q.LastModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(q);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var q = await _db.Questions.FindAsync(id);
        if (q is null) return NotFound();
        if (await _db.ScholarshipRequirements.AnyAsync(r => r.QuestionId == id))
            return Conflict("This question is used in scholarship requirements and cannot be deleted.");
        _db.Questions.Remove(q);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record QuestionRequest(
    string QuestionDescription,
    int QuestionTypeId,
    int? QuestionOrder,
    string? QuestionTypeAttributes
);
