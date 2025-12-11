import { beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './fixtures/database';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

