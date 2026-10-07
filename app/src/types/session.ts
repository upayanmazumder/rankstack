export interface LoginRequest {
  email: string;
  password: string;
}

export interface Session {
  sessionId: string;
  userId: string;
  expiresInSeconds: number;
}
