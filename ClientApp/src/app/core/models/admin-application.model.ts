export interface AdminApplication {
  applicationId: string;
  scholarshipApplicationName: string;
  organizationId: string;
  orgName: string;
  subOrganizationId?: string | null;
  subOrgName?: string | null;
  questionCount: number;
}

export interface ApplicationQuestionRow {
  applicationQuestionId: string;
  applicationId: string;
  questionId: string;
  questionDescription: string;
  questionTypeId: number;
  questionTypeDescription: string;
  order: number;
}
