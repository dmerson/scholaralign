using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class UserScholarship
{
    [Key]
    public Guid UserScholarshipsId { get; set; }
    [MaxLength(256)]
    public string UserEmail { get; set; } = string.Empty;
    public Guid ScholarshipId { get; set; }
    public int UserScholarshipStatus { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime LastModified { get; set; }
}
