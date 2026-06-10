export interface SubOrganization {
  subOrganizationId: string;
  organizationId: string;
  subOrganizationName: string;
  subOrganizationParentId?: string | null;
  parentName?: string | null;
  childCount?: number;
}
