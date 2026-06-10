export interface QuestionType {
  questionTypeId: number;
  questionTypeDescription: string;
}

export interface Question {
  questionId: string;
  questionDescription: string;
  questionTypeId: number;
  questionTypeName?: string;
  questionOrder?: number | null;
  questionTypeAttributes?: string | null;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  lastModified: string;
}
