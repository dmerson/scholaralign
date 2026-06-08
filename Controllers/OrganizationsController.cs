using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orgs = await db.Organizations
            .Select(o => new { o.Id, o.Name, o.Description, o.Website, o.ContactEmail, o.CreatedAt })
            .ToListAsync();
        return Ok(orgs);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var org = await db.Organizations.FindAsync(id);
        return org is null ? NotFound() : Ok(org);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Organization org)
    {
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = org.Id }, org);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Organization updated)
    {
        var org = await db.Organizations.FindAsync(id);
        if (org is null) return NotFound();

        org.Name = updated.Name;
        org.Description = updated.Description;
        org.Website = updated.Website;
        org.ContactEmail = updated.ContactEmail;

        await db.SaveChangesAsync();
        return Ok(org);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var org = await db.Organizations.FindAsync(id);
        if (org is null) return NotFound();

        db.Organizations.Remove(org);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
