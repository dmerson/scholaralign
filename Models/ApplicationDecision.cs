using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ApplicationDecision
{
    [Key]
    public int DecisionId { get; set; }
    [MaxLength(20)]
    public string DecisionName { get; set; } = string.Empty;
}
