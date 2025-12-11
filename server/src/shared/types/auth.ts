import { User } from './models';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthPayload {
  user: User;
  tokens: AuthTokens;
}

export interface AuthenticatedRequest {
  userId: string;
  role?: 'admin' | 'user';
  email?: string;
}

