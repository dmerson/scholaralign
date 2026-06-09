using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class OrganizationUser : CreatedAuditEntity
{
    public Guid OrganizationUserId { get; set; }
    public Guid OrganizationId { get; set; }
    [MaxLength(256)]
    public string UserEmail { get; set; } = string.Empty;
}
