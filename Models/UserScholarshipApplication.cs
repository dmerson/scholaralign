using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class UserScholarshipApplication : AuditableEntity
{
    [Key]
    public Guid ScholarshipApplicationId { get; set; }
    public Guid ScholarshipId { get; set; }
    public Guid UserApplicationId { get; set; }
    [MaxLength(256)]
    public string UserEmail { get; set; } = string.Empty;
    public int UserScholarshipStatusId { get; set; }
}
