import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPoolCtor = vi.fn().mockImplementation((opts: any) => ({
  opts,
  query: vi.fn(),
  connect: vi.fn().mockResolvedValue({ query: vi.fn(), release: vi.fn() }),
  on: vi.fn(),
  end: vi.fn(),
}));

describe('database service', () => {
  beforeEach(() => {
    vi.resetModules();
    mockPoolCtor.mockClear();
  });

  it('returns null when DATABASE_URL is missing', async () => {
    vi.doMock('../../../src/config/env', () => ({
      config: { databaseUrl: '', isProduction: false },
    }));
    const { initializeDatabase } = await import('../../../src/services/database');
    const pool = initializeDatabase();
    expect(pool).toBeNull();
  });

  it('creates pool with SSL in production', async () => {
    vi.doMock('pg', () => ({ Pool: mockPoolCtor }));
    vi.doMock('../../../src/config/env', () => ({
      config: { databaseUrl: 'postgres://user:pass@localhost:5432/db', isProduction: true },
    }));

    const { initializeDatabase } = await import('../../../src/services/database');
    const pool = initializeDatabase() as any;

    expect(mockPoolCtor).toHaveBeenCalledTimes(1);
    expect(pool.opts.connectionString).toContain('postgres://user:pass@localhost:5432/db');
    expect(pool.opts.ssl).toEqual({ rejectUnauthorized: false });
  });
});

