using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public OrganizationsController(ApplicationDbContext db) => _db = db;

    // GET /api/organizations
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _db.Organizations
            .OrderBy(o => o.OrganizationName)
            .ToListAsync());

    // GET /api/organizations/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var org = await _db.Organizations.FindAsync(id);
        return org is null ? NotFound() : Ok(org);
    }

    // POST /api/organizations
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrganizationRequest req)
    {
        var actor = User.Identity?.Name ?? "system";
        var now = DateTime.UtcNow;

        var org = new Organization
        {
            OrganizationId = Guid.NewGuid(),
            OrganizationName = req.OrganizationName,
            Contact = req.Contact,
            WebSite = req.WebSite,
            IsPublic = req.IsPublic,
            CreatedBy = actor,
            CreatedOn = now,
            UpdatedBy = actor,
            LastModified = now
        };

        _db.Organizations.Add(org);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = org.OrganizationId }, new { org.OrganizationId });
    }

    // PUT /api/organizations/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] OrganizationRequest req)
    {
        var org = await _db.Organizations.FindAsync(id);
        if (org is null) return NotFound();

        var actor = User.Identity?.Name ?? "system";

        org.OrganizationName = req.OrganizationName;
        org.Contact = req.Contact;
        org.WebSite = req.WebSite;
        org.IsPublic = req.IsPublic;
        org.UpdatedBy = actor;
        org.LastModified = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { org.OrganizationId });
    }

    // DELETE /api/organizations/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // The public seed org (Guid.Empty) is protected
        if (id == Guid.Empty)
            return Conflict("The public organization cannot be deleted.");

        var org = await _db.Organizations.FindAsync(id);
        if (org is null) return NotFound();

        if (await _db.SubOrganizations.AnyAsync(s => s.OrganizationId == id))
            return Conflict("Organization has sub-organizations and cannot be deleted.");

        if (await _db.ScholarshipAbstracts.AnyAsync(a => a.OrganizationId == id))
            return Conflict("Organization has scholarships and cannot be deleted.");

        _db.Organizations.Remove(org);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record OrganizationRequest(
    string OrganizationName,
    string Contact,
    string WebSite,
    bool IsPublic
);
