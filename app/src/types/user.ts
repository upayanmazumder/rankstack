export type Role = 'participant' | 'admin';

export interface User {
  id: string;
  name: string;
  /** Present only for the signed-in user's own profile and for administrators. */
  email?: string;
  role: Role;
  totalScore: number;
  teamIds: string[];
  createdAt: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: Role;
}
