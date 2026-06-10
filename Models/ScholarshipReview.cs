using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ScholarshipReview : AuditableEntity
{
    public Guid ScholarshipReviewId { get; set; }
    public Guid ScholarshipApplicationId { get; set; }
    [MaxLength(256)]
    public string ReviewerEmail { get; set; } = string.Empty;
    [MaxLength(8000)]
    public string? ReviewerNotes { get; set; }
    public int? ReviewerDecision { get; set; }
    public int? ReviewerRating { get; set; }
}
