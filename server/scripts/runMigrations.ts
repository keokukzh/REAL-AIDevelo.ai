import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.includes('localhost')) {
    // If running inside docker the service name will be 'postgres'
    return envUrl.replace('localhost', 'postgres');
  }
  return envUrl || 'postgres://aidevelo:aidevelo@postgres:5432/aidevelo_dev';
}

export async function runMigrations(): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  console.log('[migrations] Using DATABASE_URL:', databaseUrl);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  // Ensure migrations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);

  // Read migration files
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('[migrations] No migrations directory found at', MIGRATIONS_DIR);
    await client.end();
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const name = file;
    // Check if applied
    const res = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (res.rows.length > 0) {
      console.log(`[migrations] Skipping already-applied: ${name}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`[migrations] Applying ${name}...`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`[migrations] Applied ${name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrations] Failed to apply ${name}:`, err);
      await client.end();
      throw err;
    }
  }

  await client.end();
  console.log('[migrations] All migrations processed');
}

if (require.main === module) {
  runMigrations().catch(e => {
    console.error('[migrations] Error during migration run:', e);
    process.exit(1);
  });
}
