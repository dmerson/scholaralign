using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AwardYearsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public AwardYearsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? organizationId)
    {
        var query = _db.AwardYears.AsQueryable();
        if (organizationId.HasValue)
            query = query.Where(a => a.OrganizationId == organizationId.Value);
        var list = await query
            .OrderByDescending(a => a.Year)
            .ThenBy(a => a.Semester)
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var a = await _db.AwardYears.FindAsync(id);
        return a is null ? NotFound() : Ok(a);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AwardYearRequest req)
    {
        var a = new AwardYear
        {
            AwardYearId = Guid.NewGuid(),
            OrganizationId = req.OrganizationId,
            AwardYearDescription = req.AwardYearDescription,
            Year = req.Year,
            Semester = req.Semester,
            CreatedBy = User.Identity?.Name ?? "system",
            CreatedOn = DateTime.UtcNow,
            UpdatedBy = User.Identity?.Name ?? "system",
            LastModified = DateTime.UtcNow
        };
        _db.AwardYears.Add(a);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = a.AwardYearId }, a);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AwardYearRequest req)
    {
        var a = await _db.AwardYears.FindAsync(id);
        if (a is null) return NotFound();
        a.AwardYearDescription = req.AwardYearDescription;
        a.Year = req.Year;
        a.Semester = req.Semester;
        a.UpdatedBy = User.Identity?.Name ?? "system";
        a.LastModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(a);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var a = await _db.AwardYears.FindAsync(id);
        if (a is null) return NotFound();
        if (await _db.Scholarships.AnyAsync(s => s.AwardYearId == id))
            return Conflict("This award year is used by scholarships and cannot be deleted.");
        _db.AwardYears.Remove(a);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record AwardYearRequest(
    Guid OrganizationId,
    string AwardYearDescription,
    int Year,
    string Semester
);
