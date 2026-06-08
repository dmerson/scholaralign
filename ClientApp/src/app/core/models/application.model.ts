import { Scholarship } from './scholarship.model';

export type ApplicationStatus = 'Submitted' | 'UnderReview' | 'Accepted' | 'Rejected';

export interface ScholarshipApplication {
  id: number;
  essay?: string;
  status: ApplicationStatus;
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  scholarshipId: number;
  scholarship: Scholarship;
  userId: string;
}
