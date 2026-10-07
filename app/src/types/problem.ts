export type Difficulty = 'easy' | 'medium' | 'hard';
export type ProblemType = 'mcq' | 'coding' | 'subjective';

export interface CodingTestCase {
  input: string;
  output: string;
}

export interface Problem {
  id: string;
  contestId: string;
  type: ProblemType;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  attemptCount: number;
  createdAt: string;
  // MCQ
  options?: string[];
  correctAnswer?: string;
  // Coding
  inputFormat?: string;
  constraints?: string;
  testCases?: CodingTestCase[];
  // Subjective
  wordLimit?: number;
  evaluationRubric?: string;
}
