using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/org-users")]
public class OrgUsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public OrgUsersController(ApplicationDbContext db) => _db = db;

    // GET /api/org-users/role-names
    [HttpGet("role-names")]
    public async Task<IActionResult> GetRoleNames()
        => Ok(await _db.OrganizationRoleNames
            .OrderBy(r => r.OrganizationRoleNameId)
            .ToListAsync());

    // GET /api/org-users?organizationId={guid}
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] Guid organizationId)
    {
        var users = await _db.OrganizationUsers
            .Where(u => u.OrganizationId == organizationId)
            .OrderBy(u => u.UserEmail)
            .ToListAsync();

        var emails = users.Select(u => u.UserEmail).ToList();

        var roles = await (
            from r in _db.OrganizationRoles
            join rn in _db.OrganizationRoleNames on r.OrganizationRoleNameId equals rn.OrganizationRoleNameId
            where r.OrganizationId == organizationId && emails.Contains(r.UserEmail)
            select new
            {
                r.OrganizationRoleId,
                r.UserEmail,
                r.OrganizationRoleNameId,
                rn.OrganizationRoleNameDescription
            }
        ).ToListAsync();

        var result = users.Select(u => new
        {
            u.OrganizationUserId,
            u.UserEmail,
            Roles = roles
                .Where(r => r.UserEmail == u.UserEmail)
                .Select(r => new
                {
                    r.OrganizationRoleId,
                    r.OrganizationRoleNameId,
                    r.OrganizationRoleNameDescription
                })
                .ToList()
        });

        return Ok(result);
    }

    // POST /api/org-users
    [HttpPost]
    public async Task<IActionResult> AddUser([FromBody] AddOrgUserRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.UserEmail))
            return BadRequest("Email is required.");

        var email = req.UserEmail.Trim().ToLowerInvariant();

        if (await _db.OrganizationUsers.AnyAsync(u =>
            u.OrganizationId == req.OrganizationId && u.UserEmail == email))
            return Conflict("User is already a member of this organization.");

        var actor = User.Identity?.Name ?? "system";
        var now = DateTime.UtcNow;
        var user = new OrganizationUser
        {
            OrganizationUserId = Guid.NewGuid(),
            OrganizationId = req.OrganizationId,
            UserEmail = email,
            CreatedBy = actor, CreatedOn = now
        };
        _db.OrganizationUsers.Add(user);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUsers), new { organizationId = req.OrganizationId },
            new { user.OrganizationUserId });
    }

    // DELETE /api/org-users/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> RemoveUser(Guid id)
    {
        var user = await _db.OrganizationUsers.FindAsync(id);
        if (user is null) return NotFound();

        var roles = await _db.OrganizationRoles
            .Where(r => r.OrganizationId == user.OrganizationId && r.UserEmail == user.UserEmail)
            .ToListAsync();
        _db.OrganizationRoles.RemoveRange(roles);
        _db.OrganizationUsers.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/org-users/{id}/roles
    [HttpPost("{id:guid}/roles")]
    public async Task<IActionResult> AddRole(Guid id, [FromBody] AddOrgRoleRequest req)
    {
        var user = await _db.OrganizationUsers.FindAsync(id);
        if (user is null) return NotFound();

        if (await _db.OrganizationRoles.AnyAsync(r =>
            r.OrganizationId == user.OrganizationId &&
            r.UserEmail == user.UserEmail &&
            r.OrganizationRoleNameId == req.OrganizationRoleNameId))
            return Conflict("User already has this role.");

        var actor = User.Identity?.Name ?? "system";
        var now = DateTime.UtcNow;
        var role = new OrganizationRole
        {
            OrganizationRoleId = Guid.NewGuid(),
            OrganizationId = user.OrganizationId,
            UserEmail = user.UserEmail,
            OrganizationRoleNameId = req.OrganizationRoleNameId,
            CreatedBy = actor, CreatedOn = now
        };
        _db.OrganizationRoles.Add(role);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUsers), new { organizationId = user.OrganizationId },
            new { role.OrganizationRoleId });
    }

    // DELETE /api/org-users/{id}/roles/{roleId}
    [HttpDelete("{id:guid}/roles/{roleId:guid}")]
    public async Task<IActionResult> RemoveRole(Guid id, Guid roleId)
    {
        var role = await _db.OrganizationRoles.FindAsync(roleId);
        if (role is null) return NotFound();
        _db.OrganizationRoles.Remove(role);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record AddOrgUserRequest(Guid OrganizationId, string UserEmail);
public record AddOrgRoleRequest(int OrganizationRoleNameId);
