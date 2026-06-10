using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/committees")]
public class CommitteesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public CommitteesController(ApplicationDbContext db) => _db = db;

    // GET /api/committees?organizationId={guid}
    // Returns every scholarship for the org with its assigned committees.
    [HttpGet]
    public async Task<IActionResult> GetByOrg([FromQuery] Guid organizationId)
    {
        var scholarships = await (
            from s in _db.Scholarships
            join a in _db.ScholarshipAbstracts on s.ScholarshipAbstractId equals a.ScholarshipAbstractId
            where a.OrganizationId == organizationId
            orderby a.ScholarshipName
            select new { s.ScholarshipId, a.ScholarshipName }
        ).ToListAsync();

        if (scholarships.Count == 0)
            return Ok(Array.Empty<object>());

        var scholarshipIds = scholarships.Select(s => s.ScholarshipId).ToList();

        var assignments = await (
            from sc in _db.ScholarshipCommittees
            join so in _db.SubOrganizations on sc.SubOrganizationId equals so.SubOrganizationId
            where scholarshipIds.Contains(sc.ScholarshipId)
            select new
            {
                sc.ScholarshipCommitteeId,
                sc.ScholarshipId,
                sc.SubOrganizationId,
                so.SubOrganizationName
            }
        ).ToListAsync();

        var result = scholarships.Select(s => new
        {
            s.ScholarshipId,
            s.ScholarshipName,
            Committees = assignments
                .Where(a => a.ScholarshipId == s.ScholarshipId)
                .Select(a => new
                {
                    a.ScholarshipCommitteeId,
                    a.SubOrganizationId,
                    a.SubOrganizationName
                })
                .ToList()
        });

        return Ok(result);
    }

    // POST /api/committees
    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] AssignCommitteeRequest req)
    {
        if (await _db.ScholarshipCommittees.AnyAsync(sc =>
            sc.ScholarshipId == req.ScholarshipId &&
            sc.SubOrganizationId == req.SubOrganizationId))
            return Conflict("This committee is already assigned to that scholarship.");

        var sc = new ScholarshipCommittee
        {
            ScholarshipCommitteeId = Guid.NewGuid(),
            ScholarshipId = req.ScholarshipId,
            SubOrganizationId = req.SubOrganizationId,
            CreatedBy = User.Identity?.Name ?? "system",
            CreatedOn = DateTime.UtcNow
        };
        _db.ScholarshipCommittees.Add(sc);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetByOrg), new { }, new { sc.ScholarshipCommitteeId });
    }

    // DELETE /api/committees/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Unassign(Guid id)
    {
        var sc = await _db.ScholarshipCommittees.FindAsync(id);
        if (sc is null) return NotFound();
        _db.ScholarshipCommittees.Remove(sc);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record AssignCommitteeRequest(Guid ScholarshipId, Guid SubOrganizationId);
