import { initializeDatabase, closeDatabase } from '../../src/services/database';
import { dbTestHelpers } from '../helpers/testHelpers';

/**
 * Initialize the test database connection. Safe to call multiple times.
 */
export function setupTestDatabase(): void {
  if (!process.env.DATABASE_URL) {
    console.warn('[Test DB] DATABASE_URL not set. Integration tests will be skipped.');
    return;
  }
  initializeDatabase();
}

/**
 * Clean tables between tests. Provide explicit table names to avoid accidental truncation.
 */
export async function cleanTables(tables: string[]): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  if (!tables.length) return;
  await dbTestHelpers.truncateTables(tables);
}

/**
 * Close the test database pool.
 */
export async function teardownTestDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await closeDatabase();
}

