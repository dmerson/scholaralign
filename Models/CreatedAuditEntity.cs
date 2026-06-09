using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public abstract class CreatedAuditEntity
{
    [MaxLength(256)]
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
}
