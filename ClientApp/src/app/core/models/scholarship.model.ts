import { Organization } from './organization.model';

export type ScholarshipStatus = 'Draft' | 'Active' | 'Closed';

export interface Scholarship {
  id: number;
  title: string;
  description: string;
  amount: number;
  deadline: string;
  eligibilityCriteria?: string;
  status: ScholarshipStatus;
  createdAt: string;
  organization: Pick<Organization, 'id' | 'name'>;
  applicationCount?: number;
}
