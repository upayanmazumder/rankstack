export type ContestStatus = 'upcoming' | 'live' | 'ended';
export type ParticipantRefType = 'user' | 'team';

export interface ParticipantRef {
  refType: ParticipantRefType;
  refId: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: ContestStatus;
  createdBy: string;
  problemIds: string[];
  participants: ParticipantRef[];
  createdAt: string;
}

export interface ContestCreate {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  problemIds?: string[];
}

export interface ContestUpdate {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

export interface LeaderboardEntry {
  memberId: string;
  score: number;
  rank: number;
}
