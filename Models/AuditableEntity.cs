using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public abstract class AuditableEntity
{
    [MaxLength(256)]
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
    [MaxLength(256)]
    public string UpdatedBy { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
}
