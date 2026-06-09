using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ScholarshipApplicationReview : AuditableEntity
{
    public Guid ScholarshipApplicationReviewId { get; set; }
    public Guid ScholarshipApplicationId { get; set; }
    [MaxLength(256)]
    public string ReviewEmail { get; set; } = string.Empty;
    [MaxLength(8000)]
    public string ReviewerNotes { get; set; } = string.Empty;
    public int? ReviewerDecision { get; set; }
    public int? ReviewerRating { get; set; }
}
