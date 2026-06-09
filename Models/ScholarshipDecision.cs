using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ScholarshipDecision : AuditableEntity
{
    [Key]
    public Guid ScholarshipApplicationDecisionId { get; set; }
    public Guid ScholarshipApplicationId { get; set; }
    [MaxLength(256)]
    public string? ReviewersEmail { get; set; }
    public int DecisionId { get; set; }
}
