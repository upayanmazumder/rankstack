// Cross-cutting TS types. Feature-local types stay colocated with their feature.

export interface ApiErrorData {
  message: string;
  code?: string;
  details?: unknown;
  status?: number;
}

export type { User, UserUpdate, Role } from './user';
export type {
  Contest,
  ContestCreate,
  ContestUpdate,
  ContestStatus,
  ParticipantRefType,
  LeaderboardEntry,
} from './contest';
export type { Problem, ProblemCreate, Difficulty } from './problem';
export type { Submission, SubmissionCreate, SubmissionStatus } from './submission';
export type { Team, TeamCreate } from './team';
export type { Session, LoginRequest } from './session';
