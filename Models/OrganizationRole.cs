using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class OrganizationRole : CreatedAuditEntity
{
    public Guid OrganizationRoleId { get; set; }
    public Guid OrganizationId { get; set; }
    [MaxLength(256)]
    public string UserEmail { get; set; } = string.Empty;
    public int OrganizationRoleNameId { get; set; }
}
