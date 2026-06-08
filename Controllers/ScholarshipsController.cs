using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScholarshipsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = db.Scholarships
            .Include(s => s.Organization)
            .AsQueryable();

        if (Enum.TryParse<ScholarshipStatus>(status, ignoreCase: true, out var parsedStatus))
            query = query.Where(s => s.Status == parsedStatus);

        var scholarships = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id, s.Title, s.Description, s.Amount, s.Deadline,
                s.EligibilityCriteria, s.Status, s.CreatedAt,
                Organization = new { s.Organization.Id, s.Organization.Name },
                ApplicationCount = s.Applications.Count
            })
            .ToListAsync();

        return Ok(scholarships);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var scholarship = await db.Scholarships
            .Include(s => s.Organization)
            .FirstOrDefaultAsync(s => s.Id == id);

        return scholarship is null ? NotFound() : Ok(scholarship);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Scholarship scholarship)
    {
        db.Scholarships.Add(scholarship);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = scholarship.Id }, scholarship);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Scholarship updated)
    {
        var scholarship = await db.Scholarships.FindAsync(id);
        if (scholarship is null) return NotFound();

        scholarship.Title = updated.Title;
        scholarship.Description = updated.Description;
        scholarship.Amount = updated.Amount;
        scholarship.Deadline = updated.Deadline;
        scholarship.EligibilityCriteria = updated.EligibilityCriteria;
        scholarship.Status = updated.Status;
        scholarship.OrganizationId = updated.OrganizationId;

        await db.SaveChangesAsync();
        return Ok(scholarship);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var scholarship = await db.Scholarships.FindAsync(id);
        if (scholarship is null) return NotFound();

        db.Scholarships.Remove(scholarship);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
