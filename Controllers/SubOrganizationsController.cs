using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubOrganizationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public SubOrganizationsController(ApplicationDbContext db) => _db = db;

    // GET /api/suborganizations?organizationId={guid}
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid organizationId)
    {
        var query = from s in _db.SubOrganizations
                    join p in _db.SubOrganizations
                        on s.SubOrganizationParentId equals p.SubOrganizationId into parentJoin
                    from p in parentJoin.DefaultIfEmpty()
                    where s.OrganizationId == organizationId
                    orderby s.SubOrganizationParentId, s.SubOrganizationName
                    select new
                    {
                        s.SubOrganizationId,
                        s.OrganizationId,
                        s.SubOrganizationName,
                        s.SubOrganizationParentId,
                        ParentName = p != null ? p.SubOrganizationName : null,
                        ChildCount = _db.SubOrganizations
                            .Count(c => c.SubOrganizationParentId == s.SubOrganizationId)
                    };

        return Ok(await query.ToListAsync());
    }

    // GET /api/suborganizations/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await (from s in _db.SubOrganizations
                            join p in _db.SubOrganizations
                                on s.SubOrganizationParentId equals p.SubOrganizationId into parentJoin
                            from p in parentJoin.DefaultIfEmpty()
                            where s.SubOrganizationId == id
                            select new
                            {
                                s.SubOrganizationId,
                                s.OrganizationId,
                                s.SubOrganizationName,
                                s.SubOrganizationParentId,
                                ParentName = p != null ? p.SubOrganizationName : null,
                                ChildCount = _db.SubOrganizations
                                    .Count(c => c.SubOrganizationParentId == s.SubOrganizationId)
                            }).FirstOrDefaultAsync();

        return result is null ? NotFound() : Ok(result);
    }

    // POST /api/suborganizations
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SubOrganizationRequest req)
    {
        var actor = User.Identity?.Name ?? "system";
        var now = DateTime.UtcNow;

        var sub = new SubOrganization
        {
            SubOrganizationId = Guid.NewGuid(),
            OrganizationId = req.OrganizationId,
            SubOrganizationName = req.SubOrganizationName,
            SubOrganizationParentId = req.SubOrganizationParentId,
            CreatedBy = actor,
            CreatedOn = now,
            UpdatedBy = actor,
            LastModified = now
        };

        _db.SubOrganizations.Add(sub);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = sub.SubOrganizationId }, new { sub.SubOrganizationId });
    }

    // PUT /api/suborganizations/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SubOrganizationRequest req)
    {
        var sub = await _db.SubOrganizations.FindAsync(id);
        if (sub is null) return NotFound();

        var actor = User.Identity?.Name ?? "system";

        sub.SubOrganizationName = req.SubOrganizationName;
        sub.SubOrganizationParentId = req.SubOrganizationParentId;
        sub.UpdatedBy = actor;
        sub.LastModified = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { sub.SubOrganizationId });
    }

    // DELETE /api/suborganizations/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var sub = await _db.SubOrganizations.FindAsync(id);
        if (sub is null) return NotFound();

        if (await _db.SubOrganizations.AnyAsync(c => c.SubOrganizationParentId == id))
            return Conflict("Has child suborganizations.");

        if (await _db.ScholarshipAbstracts.AnyAsync(a => a.SubOrganizationId == id))
            return Conflict("Used by scholarships.");

        if (await _db.ScholarshipCommittees.AnyAsync(c => c.SubOrganizationId == id))
            return Conflict("Has committee assignments.");

        _db.SubOrganizations.Remove(sub);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record SubOrganizationRequest(
    Guid OrganizationId,
    string SubOrganizationName,
    Guid? SubOrganizationParentId
);
