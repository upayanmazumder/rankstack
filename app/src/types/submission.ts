export type SubmissionStatus = 'pending' | 'correct' | 'incorrect' | 'partial';
export type SubmissionRefType = 'user' | 'team';

export interface SubmittedBy {
  refType: SubmissionRefType;
  refId: string;
}

export interface Submission {
  id: string;
  contestId: string;
  problemId: string;
  submittedBy: SubmittedBy;
  answer: unknown;
  status: SubmissionStatus;
  score: number;
  submittedAt: string;
}

export interface SubmissionCreate {
  contestId: string;
  problemId: string;
  submittedBy: SubmittedBy;
  answer: unknown;
}
