using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class ScholarshipStatus
{
    public int ScholarshipStatusId { get; set; }
    [MaxLength(20)]
    public string ScholarshipStatusDescription { get; set; } = string.Empty;
}
