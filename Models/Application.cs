using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class Application : AuditableEntity
{
    public Guid ApplicationId { get; set; }
    public Guid OrganizationId { get; set; }
    [MaxLength(50)]
    public string ScholarshipApplicationName { get; set; } = string.Empty;
    public Guid? SubOrganizationId { get; set; }
}
