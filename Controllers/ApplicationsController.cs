using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationsController(ApplicationDbContext db) : ControllerBase
{
    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyApplications()
    {
        var apps = await db.ScholarshipApplications
            .Include(a => a.Scholarship)
            .ThenInclude(s => s.Organization)
            .Where(a => a.UserId == CurrentUserId)
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();

        return Ok(apps);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = db.ScholarshipApplications
            .Include(a => a.Scholarship)
            .Include(a => a.User)
            .AsQueryable();

        if (Enum.TryParse<ApplicationStatus>(status, ignoreCase: true, out var parsedStatus))
            query = query.Where(a => a.Status == parsedStatus);

        var apps = await query.OrderByDescending(a => a.SubmittedAt).ToListAsync();
        return Ok(apps);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var app = await db.ScholarshipApplications
            .Include(a => a.Scholarship)
            .ThenInclude(s => s.Organization)
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app is null) return NotFound();

        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && app.UserId != CurrentUserId) return Forbid();

        return Ok(app);
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitApplicationRequest request)
    {
        var scholarship = await db.Scholarships.FindAsync(request.ScholarshipId);
        if (scholarship is null) return BadRequest("Scholarship not found.");
        if (scholarship.Status != ScholarshipStatus.Active) return BadRequest("Scholarship is not accepting applications.");

        var alreadyApplied = await db.ScholarshipApplications
            .AnyAsync(a => a.ScholarshipId == request.ScholarshipId && a.UserId == CurrentUserId);

        if (alreadyApplied) return Conflict("You have already applied for this scholarship.");

        var application = new ScholarshipApplication
        {
            ScholarshipId = request.ScholarshipId,
            UserId = CurrentUserId,
            Essay = request.Essay
        };

        db.ScholarshipApplications.Add(application);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = application.Id }, application);
    }

    [HttpPatch("{id:int}/review")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewRequest request)
    {
        var app = await db.ScholarshipApplications.FindAsync(id);
        if (app is null) return NotFound();

        app.Status = request.Status;
        app.ReviewNotes = request.Notes;
        app.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(app);
    }
}

public record SubmitApplicationRequest(int ScholarshipId, string? Essay);
public record ReviewRequest(ApplicationStatus Status, string? Notes);
