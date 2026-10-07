export type Role = 'participant' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  totalScore: number;
  teamIds: string[];
  createdAt: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: Role;
}
