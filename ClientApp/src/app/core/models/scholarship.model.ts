export interface ScholarshipStatus {
  scholarshipStatusId: number;
  scholarshipStatusDescription: string;
}

export interface Scholarship {
  scholarshipId: string;
  scholarshipAbstractId: string;
  scholarshipName: string;
  scholarshipDescription: string;
  organizationId: string;
  subOrganizationId?: string | null;
  scholarshipUrl?: string | null;
  awardingInformation?: string | null;
  eligibilityInformation?: string | null;
  awardYearId?: string | null;
  awardYearDescription?: string | null;
  amount?: number | null;
  amountDescription?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  applicationId?: string | null;
  scholarshipStatus: number;
}
