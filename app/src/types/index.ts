// Cross-cutting TS types. Feature-local types stay colocated with their feature.

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface ApiErrorData {
  message: string;
  code?: string;
  details?: unknown;
  status?: number;
}

export type { User, UserCreate, UserUpdate, Role } from './user';
export type {
  Contest,
  ContestCreate,
  ContestUpdate,
  ContestStatus,
  ParticipantRef,
  ParticipantRefType,
  LeaderboardEntry,
} from './contest';
export type {
  Problem,
  ProblemCreate,
  McqProblemCreate,
  CodingProblemCreate,
  SubjectiveProblemCreate,
  Difficulty,
  ProblemType,
  CodingTestCase,
} from './problem';
export type {
  Submission,
  SubmissionCreate,
  SubmissionStatus,
  SubmittedBy,
  SubmissionRefType,
} from './submission';
export type { Team, TeamCreate, TeamUpdate } from './team';
export type { Session, LoginRequest } from './session';
