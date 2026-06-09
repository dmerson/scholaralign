using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ApplicationQuestion : AuditableEntity
{
    public Guid ApplicationQuestionId { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid QuestionId { get; set; }
    public int Order { get; set; }
}
