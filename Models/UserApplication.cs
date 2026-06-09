using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class UserApplication : AuditableEntity
{
    public Guid UserApplicationId { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid AwardYearId { get; set; }
    [MaxLength(256)]
    public string UserEmail { get; set; } = string.Empty;
    public DateTime? SubmittedDate { get; set; }
}
