using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScholarAlign.Models;

public class Scholarship : AuditableEntity
{
    public Guid ScholarshipId { get; set; }
    public Guid ScholarshipAbstractId { get; set; }
    [MaxLength(256)]
    public string ScholarshipUrl { get; set; } = string.Empty;
    [MaxLength(2000)]
    public string AwardingInformation { get; set; } = string.Empty;
    [MaxLength(2000)]
    public string EligibilityInformation { get; set; } = string.Empty;
    public Guid AwardYearId { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }
    [MaxLength(20)]
    public string AmountDescription { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public Guid? ApplicationId { get; set; }
    public int ScholarshipStatus { get; set; }
}
