using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScholarshipsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ScholarshipsController(ApplicationDbContext db) => _db = db;

    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses()
        => Ok(await _db.ScholarshipStatuses.OrderBy(s => s.ScholarshipStatusId).ToListAsync());

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? organizationId)
    {
        var query = from s in _db.Scholarships
                    join a in _db.ScholarshipAbstracts on s.ScholarshipAbstractId equals a.ScholarshipAbstractId
                    join ay in _db.AwardYears on s.AwardYearId equals ay.AwardYearId into ayJoin
                    from ay in ayJoin.DefaultIfEmpty()
                    where !organizationId.HasValue || a.OrganizationId == organizationId.Value
                    orderby a.ScholarshipName
                    select new
                    {
                        s.ScholarshipId,
                        s.ScholarshipAbstractId,
                        a.ScholarshipName,
                        a.ScholarshipDescription,
                        a.OrganizationId,
                        a.SubOrganizationId,
                        s.ScholarshipUrl,
                        s.AwardingInformation,
                        s.EligibilityInformation,
                        s.AwardYearId,
                        AwardYearDescription = ay != null ? ay.AwardYearDescription : null,
                        s.Amount,
                        s.AmountDescription,
                        s.StartDate,
                        s.EndDate,
                        s.ApplicationId,
                        s.ScholarshipStatus
                    };
        return Ok(await query.ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await (from s in _db.Scholarships
                            join a in _db.ScholarshipAbstracts on s.ScholarshipAbstractId equals a.ScholarshipAbstractId
                            where s.ScholarshipId == id
                            select new
                            {
                                s.ScholarshipId,
                                s.ScholarshipAbstractId,
                                a.ScholarshipName,
                                a.ScholarshipDescription,
                                a.OrganizationId,
                                a.SubOrganizationId,
                                s.ScholarshipUrl,
                                s.AwardingInformation,
                                s.EligibilityInformation,
                                s.AwardYearId,
                                s.Amount,
                                s.AmountDescription,
                                s.StartDate,
                                s.EndDate,
                                s.ApplicationId,
                                s.ScholarshipStatus
                            }).FirstOrDefaultAsync();
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ScholarshipRequest req)
    {
        var actor = User.Identity?.Name ?? "system";
        var now = DateTime.UtcNow;

        var abstract_ = new ScholarshipAbstract
        {
            ScholarshipAbstractId = Guid.NewGuid(),
            ScholarshipName = req.ScholarshipName,
            ScholarshipDescription = req.ScholarshipDescription,
            OrganizationId = req.OrganizationId,
            SubOrganizationId = req.SubOrganizationId,
            CreatedBy = actor, CreatedOn = now, UpdatedBy = actor, LastModified = now
        };
        var scholarship = new Scholarship
        {
            ScholarshipId = Guid.NewGuid(),
            ScholarshipAbstractId = abstract_.ScholarshipAbstractId,
            ScholarshipUrl = req.ScholarshipUrl,
            AwardingInformation = req.AwardingInformation,
            EligibilityInformation = req.EligibilityInformation,
            AwardYearId = req.AwardYearId,
            Amount = req.Amount,
            AmountDescription = req.AmountDescription,
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            ApplicationId = req.ApplicationId,
            ScholarshipStatus = req.ScholarshipStatus,
            CreatedBy = actor, CreatedOn = now, UpdatedBy = actor, LastModified = now
        };
        _db.ScholarshipAbstracts.Add(abstract_);
        _db.Scholarships.Add(scholarship);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = scholarship.ScholarshipId }, new { scholarship.ScholarshipId });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ScholarshipRequest req)
    {
        var scholarship = await _db.Scholarships.FindAsync(id);
        if (scholarship is null) return NotFound();
        var abstract_ = await _db.ScholarshipAbstracts.FindAsync(scholarship.ScholarshipAbstractId);
        if (abstract_ is null) return NotFound();

        var actor = User.Identity?.Name ?? "system";
        var now = DateTime.UtcNow;

        abstract_.ScholarshipName = req.ScholarshipName;
        abstract_.ScholarshipDescription = req.ScholarshipDescription;
        abstract_.SubOrganizationId = req.SubOrganizationId;
        abstract_.UpdatedBy = actor; abstract_.LastModified = now;

        scholarship.ScholarshipUrl = req.ScholarshipUrl;
        scholarship.AwardingInformation = req.AwardingInformation;
        scholarship.EligibilityInformation = req.EligibilityInformation;
        scholarship.AwardYearId = req.AwardYearId;
        scholarship.Amount = req.Amount;
        scholarship.AmountDescription = req.AmountDescription;
        scholarship.StartDate = req.StartDate;
        scholarship.EndDate = req.EndDate;
        scholarship.ApplicationId = req.ApplicationId;
        scholarship.ScholarshipStatus = req.ScholarshipStatus;
        scholarship.UpdatedBy = actor; scholarship.LastModified = now;

        await _db.SaveChangesAsync();
        return Ok(new { scholarship.ScholarshipId });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var scholarship = await _db.Scholarships.FindAsync(id);
        if (scholarship is null) return NotFound();
        if (await _db.ScholarshipRequirements.AnyAsync(r => r.ScholarshipId == id))
            return Conflict("This scholarship has requirements attached and cannot be deleted.");

        var abstractId = scholarship.ScholarshipAbstractId;
        _db.Scholarships.Remove(scholarship);
        await _db.SaveChangesAsync();

        var otherScholarships = await _db.Scholarships.AnyAsync(s => s.ScholarshipAbstractId == abstractId);
        if (!otherScholarships)
        {
            var abstract_ = await _db.ScholarshipAbstracts.FindAsync(abstractId);
            if (abstract_ is not null) _db.ScholarshipAbstracts.Remove(abstract_);
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }
}

public record ScholarshipRequest(
    string ScholarshipName,
    string ScholarshipDescription,
    Guid OrganizationId,
    Guid? SubOrganizationId,
    string? ScholarshipUrl,
    string? AwardingInformation,
    string? EligibilityInformation,
    Guid? AwardYearId,
    decimal? Amount,
    string? AmountDescription,
    DateTime? StartDate,
    DateTime? EndDate,
    Guid? ApplicationId,
    int ScholarshipStatus
);
