using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class QuestionType
{
    public int QuestionTypeId { get; set; }
    [MaxLength(30)]
    public string QuestionTypeDescription { get; set; } = string.Empty;
}
