using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ScholarshipRequirement : AuditableEntity
{
    public Guid ScholarshipRequirementId { get; set; }
    public Guid ScholarshipId { get; set; }
    public Guid QuestionId { get; set; }
    public int OperatorId { get; set; }
    [MaxLength(8000)]
    public string RequirementValue { get; set; } = string.Empty;
    public int Grouping { get; set; } = 1;
}
