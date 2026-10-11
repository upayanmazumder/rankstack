export type Difficulty = 'easy' | 'medium' | 'hard';
type ProblemType = 'mcq' | 'coding' | 'subjective';

interface CodingTestCase {
  input: string;
  output: string;
}

interface ProblemCreateBase {
  contestId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
}

interface McqProblemCreate extends ProblemCreateBase {
  type: 'mcq';
  options: string[];
  correctAnswer: string;
}

interface CodingProblemCreate extends ProblemCreateBase {
  type: 'coding';
  inputFormat: string;
  constraints: string;
  testCases: CodingTestCase[];
}

interface SubjectiveProblemCreate extends ProblemCreateBase {
  type: 'subjective';
  wordLimit: number;
  evaluationRubric: string;
}

export type ProblemCreate = McqProblemCreate | CodingProblemCreate | SubjectiveProblemCreate;

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
