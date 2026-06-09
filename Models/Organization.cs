using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class Organization : AuditableEntity
{
    public Guid OrganizationId { get; set; }
    [MaxLength(200)]
    public string OrganizationName { get; set; } = string.Empty;
    [MaxLength(256)]
    public string Contact { get; set; } = string.Empty;
    [MaxLength(256)]
    public string WebSite { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
}
