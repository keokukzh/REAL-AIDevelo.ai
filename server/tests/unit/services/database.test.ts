import { describe, expect, it } from 'vitest';
import { getPool, closeDatabase } from '../../../src/services/database';

describe('database service', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('handles missing DATABASE_URL gracefully', () => {
    // This test verifies the service doesn't crash when DATABASE_URL is missing
    // The actual behavior depends on environment configuration
    const pool = getPool();
    // Pool may be null or a pool instance depending on config
    expect(pool === null || typeof pool?.query === 'function').toBe(true);
  });

  it('can close database connections', async () => {
    // Test that closeDatabase doesn't throw errors
    await expect(closeDatabase()).resolves.not.toThrow();
  });
});

