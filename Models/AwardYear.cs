using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class AwardYear : AuditableEntity
{
    public Guid AwardYearId { get; set; }
    public Guid OrganizationId { get; set; }
    [MaxLength(30)]
    public string AwardYearDescription { get; set; } = string.Empty;
    public int Year { get; set; }
    [MaxLength(50)]
    public string Semester { get; set; } = string.Empty;
}
