using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class Question : AuditableEntity
{
    public Guid QuestionId { get; set; }
    [MaxLength(1000)]
    public string QuestionDescription { get; set; } = string.Empty;
    public int QuestionTypeId { get; set; }
    public int? QuestionOrder { get; set; }
    public string? QuestionTypeAttributes { get; set; }
}
