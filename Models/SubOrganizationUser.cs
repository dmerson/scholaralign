using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class SubOrganizationUser : CreatedAuditEntity
{
    public Guid SubOrganizationUserId { get; set; }
    public Guid SubOrganizationId { get; set; }
    [MaxLength(256)]
    public string UserEmail { get; set; } = string.Empty;
}
