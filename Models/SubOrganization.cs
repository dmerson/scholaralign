using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class SubOrganization : AuditableEntity
{
    public Guid SubOrganizationId { get; set; }
    public Guid OrganizationId { get; set; }
    [MaxLength(100)]
    public string SubOrganizationName { get; set; } = string.Empty;
    public Guid? SubOrganizationParentId { get; set; }
}
