using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ScholarshipAbstract : AuditableEntity
{
    public Guid ScholarshipAbstractId { get; set; }
    [MaxLength(200)]
    public string ScholarshipName { get; set; } = string.Empty;
    [MaxLength(8000)]
    public string ScholarshipDescription { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public Guid? SubOrganizationId { get; set; }
}
