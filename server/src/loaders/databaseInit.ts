import path from 'path';
import fs from 'fs';
import {
  getPgPool as getPool,
  testConnection,
  initializePgPool as initializeDatabase,
} from '../db/pg';
import { StructuredLoggingService } from '../services/loggingService';
import { config } from '../config/env';

/**
 * Orchestrates database initialization, connection testing, and migration execution.
 * This moves the logic out of app.ts.
 */
export async function initDatabaseStack(): Promise<boolean> {
  // 1. Check Config
  if (!config.databaseUrl) {
    StructuredLoggingService.info(
      'DATABASE_URL not set - using Supabase client directly (recommended). Legacy migrations skipped.',
    );
    return false;
  }

  // 2. Initialize Pool
  try {
    StructuredLoggingService.info('[Startup] Initializing legacy database connection...');
    initializeDatabase();

    // 3. Test Connection
    const connected = await testConnection(8);
    if (!connected) {
      logConnectionFailure();
      return false;
    }

    StructuredLoggingService.info('Legacy connection successful and ready');

    // 4. Run Migrations
    await runMigrations();

    return true;
  } catch (error) {
    StructuredLoggingService.error(
      'Failed to initialize legacy connection',
      error instanceof Error ? error : new Error(String(error)),
    );
    return false;
  }
}

function logConnectionFailure() {
  StructuredLoggingService.error(
    'Connection test failed after retries',
    new Error('Database connection test failed'),
  );
  StructuredLoggingService.warn('Server will continue - new code uses Supabase client directly');
}

async function runMigrations() {
  const pool = getPool();
  if (!pool) return;

  StructuredLoggingService.info('[Startup] Starting migrations...');

  // Locate migrations
  const possiblePaths = [
    '/app/db/migrations',
    path.join(process.cwd(), 'db/migrations'),
    path.join(process.cwd(), 'server/db/migrations'),
    path.join(__dirname, '../../../db/migrations'),
    path.join(__dirname, '../../db/migrations'),
    path.join(__dirname, '../db/migrations'),
  ];

  let migrationsDir = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      migrationsDir = p;
      break;
    }
  }

  if (!migrationsDir) {
    console.warn(
      '[Database] [Startup] Migrations directory not found. Searched in:',
      possiblePaths.join(', '),
    );
    return;
  }

  StructuredLoggingService.info(`[Database] [Startup] Using migrations from: ${migrationsDir}`);

  const client = await pool.connect();
  try {
    // Setup migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f: string) => f.endsWith('.sql'))
      .sort();

    StructuredLoggingService.info(`[Startup] Found ${files.length} migration files`);

    for (const file of files) {
      const res = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (res.rows.length > 0) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      StructuredLoggingService.info(`[Startup] Applying ${file}...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        StructuredLoggingService.info(`[Startup] Applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    StructuredLoggingService.info('[Startup] All migrations completed successfully');
  } catch (error) {
    StructuredLoggingService.error(
      '[Startup] Migration error',
      error instanceof Error ? error : new Error(String(error)),
    );
  } finally {
    client.release();
  }
}
