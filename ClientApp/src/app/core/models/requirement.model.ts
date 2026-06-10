export interface Operator {
  operatorId: number;
  operatorValue: string;
  operatorShownName: string;
}

export interface Requirement {
  scholarshipRequirementId: string;
  scholarshipId: string;
  questionId: string;
  questionDescription?: string;
  questionTypeId?: number;
  questionTypeAttributes?: string | null;
  operatorId: number;
  operatorShownName?: string;
  requirementValue: string;
  grouping: number;
}
