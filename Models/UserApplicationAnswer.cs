using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class UserApplicationAnswer
{
    [Key]
    public Guid ScholarshipApplicationAnswerId { get; set; }
    public Guid UserApplicationId { get; set; }
    public Guid ApplicationQuestionId { get; set; }
    public string ApplicationAnswerValue { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
    public DateTime LastModified { get; set; }
}
