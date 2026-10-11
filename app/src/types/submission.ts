export type SubmissionStatus = 'pending' | 'correct' | 'incorrect' | 'partial';
type SubmissionRefType = 'user' | 'team';

interface SubmittedBy {
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
