using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScholarAlign.Models;

public class Answer
{
    public Guid AnswerId { get; set; }
    public Guid QuestionId { get; set; }
    [MaxLength(256)]
    public string UserEmail { get; set; } = string.Empty;
    [Column("Answer")]
    public string AnswerValue { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
    public DateTime LastModified { get; set; }
}
