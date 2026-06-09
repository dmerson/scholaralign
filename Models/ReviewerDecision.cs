using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ReviewerDecision
{
    public int ReviewerDecisionId { get; set; }
    [MaxLength(20)]
    public string ReviewerDecisionName { get; set; } = string.Empty;
}
