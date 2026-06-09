using System.ComponentModel.DataAnnotations;

namespace ScholarAlign.Models;

public class OrganizationRoleName
{
    public int OrganizationRoleNameId { get; set; }
    [MaxLength(20)]
    public string OrganizationRoleNameDescription { get; set; } = string.Empty;
}
