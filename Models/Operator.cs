using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class Operator
{
    public int OperatorId { get; set; }
    [MaxLength(2)]
    public string OperatorValue { get; set; } = string.Empty;
    [MaxLength(30)]
    public string OperatorShownName { get; set; } = string.Empty;
}
