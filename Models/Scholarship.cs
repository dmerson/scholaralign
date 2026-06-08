namespace ScholarAlign.Models;

public enum ScholarshipStatus { Draft, Active, Closed }

public class Scholarship
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime Deadline { get; set; }
    public string? EligibilityCriteria { get; set; }
    public ScholarshipStatus Status { get; set; } = ScholarshipStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public ICollection<ScholarshipApplication> Applications { get; set; } = [];
}
