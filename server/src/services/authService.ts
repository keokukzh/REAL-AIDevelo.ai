import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthTokens, AuthenticatedRequest } from '../../shared/types/auth';

const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_TTL = '7d';

export const generateTokens = (payload: AuthenticatedRequest): AuthTokens => {
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign({ userId: payload.userId }, config.jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
  };
};

export const verifyAccessToken = (token: string): AuthenticatedRequest => {
  return jwt.verify(token, config.jwtSecret) as AuthenticatedRequest;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
};

