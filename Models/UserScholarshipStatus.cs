using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class UserScholarshipStatus
{
    public int UserScholarshipStatusId { get; set; }
    [MaxLength(20)]
    public string UserScholarshipStatusDescription { get; set; } = string.Empty;
}
