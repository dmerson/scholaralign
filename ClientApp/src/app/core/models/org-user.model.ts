export interface OrgRoleName {
  organizationRoleNameId: number;
  organizationRoleNameDescription: string;
}

export interface OrgUserRole {
  organizationRoleId: string;
  organizationRoleNameId: number;
  organizationRoleNameDescription: string;
}

export interface OrgUser {
  organizationUserId: string;
  userEmail: string;
  roles: OrgUserRole[];
}
