import { describe, expect, it } from 'vitest';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../../../src/services/authService';

describe('authService', () => {
  it('generates and verifies access and refresh tokens', () => {
    const payload = { userId: 'user-1', email: 'test@example.com' } as any;

    const { accessToken, refreshToken, expiresIn } = generateTokens(payload);

    expect(expiresIn).toBe(3600);
    const decodedAccess = verifyAccessToken(accessToken);
    expect(decodedAccess.userId).toBe(payload.userId);
    const decodedRefresh = verifyRefreshToken(refreshToken);
    expect(decodedRefresh.userId).toBe(payload.userId);
  });
});

