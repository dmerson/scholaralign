using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ScholarshipReviewer : AuditableEntity
{
    public Guid ScholarshipReviewerId { get; set; }
    public Guid ScholarshipId { get; set; }
    [MaxLength(256)]
    public string ReviewEmail { get; set; } = string.Empty;
}
