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

export interface MyAnswer {
  questionId: string;
  questionDescription: string;
  questionTypeId: number;
  questionTypeAttributes?: string | null;
  answerValue: string;
  lastModified: string;
}

export interface RequirementDetail {
  scholarshipRequirementId: string;
  grouping: number;
  questionId: string;
  questionDescription?: string | null;
  questionTypeId: number;
  questionTypeAttributes?: string | null;
  operatorId: number;
  operatorShownName?: string | null;
  requirementValue: string;
  userAnswer?: string | null;
  /** 1 = passes, -1 = fails, 0 = unknown/unanswered */
  status: number;
}

export interface ScholarshipDetailInfo {
  scholarshipId: string;
  scholarshipName: string;
  scholarshipDescription?: string | null;
  orgName: string;
  awardYearDescription?: string | null;
  amount?: number | null;
  amountDescription?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  eligibilityInformation?: string | null;
  scholarshipStatus: number;
  scholarshipUrl?: string | null;
  awardingInformation?: string | null;
}

export interface ScholarshipDetailResponse {
  scholarship: ScholarshipDetailInfo;
  userStatus: number | null;
  requirements: RequirementDetail[];
}

export interface UserApplicationSummary {
  scholarshipId: string;
  scholarshipName: string;
  orgName: string;
  amount?: number | null;
  amountDescription?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  applicationId: string;
  applicationName: string;
  questionCount: number;
  isStarted: boolean;
  isSubmitted: boolean;
  submittedDate?: string | null;
}

export interface UserApplicationQuestion {
  applicationQuestionId: string;
  questionId: string;
  questionDescription: string;
  questionTypeId: number;
  questionTypeAttributes?: string | null;
  order: number;
  answerValue?: string | null;
}

export interface UserApplicationDetail {
  scholarshipId: string;
  scholarshipName: string;
  applicationId: string;
  applicationName: string;
  isSubmitted: boolean;
  submittedDate?: string | null;
  questions: UserApplicationQuestion[];
}
