export interface ScholarshipSummary {
  scholarshipId: string;
  scholarshipName: string;
  orgName: string;
  amount?: number | null;
  amountDescription?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  eligibilityInformation?: string | null;
}

export interface DashboardData {
  eligible: ScholarshipSummary[];
  unknown: ScholarshipSummary[];
  ineligible: ScholarshipSummary[];
}
