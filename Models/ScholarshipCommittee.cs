namespace ScholarAlign.Models;

public class ScholarshipCommittee : CreatedAuditEntity
{
    public Guid ScholarshipCommitteeId { get; set; }
    public Guid ScholarshipId { get; set; }
    public Guid SubOrganizationId { get; set; }
}
