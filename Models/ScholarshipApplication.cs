namespace ScholarAlign.Models;

public enum ApplicationStatus { Submitted, UnderReview, Accepted, Rejected }

public class ScholarshipApplication
{
    public int Id { get; set; }
    public string? Essay { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public string? ReviewNotes { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }

    public int ScholarshipId { get; set; }
    public Scholarship Scholarship { get; set; } = null!;

    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
}
