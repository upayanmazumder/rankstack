export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  ownerId: string;
  totalScore: number;
  createdAt: string;
}

export interface TeamCreate {
  name: string;
  memberIds?: string[];
}

export interface TeamUpdate {
  name?: string;
}
