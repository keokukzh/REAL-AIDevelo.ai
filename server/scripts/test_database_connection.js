/*
 * Minimal database connectivity test.
 *
 * Reads DATABASE_URL from environment so no credentials are stored in the repo.
 *
 * Usage:
 *   - PowerShell:  $env:DATABASE_URL='postgresql://...'; node scripts/test_database_connection.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

function maskDatabaseUrl(url) {
  if (!url) return '(not set)';
  return url.replace(/:(?!\/\/)[^:@/]+@/g, ':****@');
}

async function main() {
  if (!DATABASE_URL) {
    console.error('❌ Missing env var: DATABASE_URL');
    console.error('   Example: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
    process.exit(1);
  }

  console.log('🔌 Testing database connection...');
  console.log('📍 Connection:', maskDatabaseUrl(DATABASE_URL));

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();

    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('\n📊 Database Info:');
    console.log('  PostgreSQL:', String(result.rows[0].version).split(' ').slice(0, 2).join(' '));
    console.log('  Database:', result.rows[0].current_database);
    console.log('  User:', result.rows[0].current_user);

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
      LIMIT 10;
    `);

    console.log('\n📋 Tables (up to 10):', tablesResult.rows.length);
    if (tablesResult.rows.length > 0) {
      console.log('  Sample:', tablesResult.rows.slice(0, 5).map((r) => r.table_name).join(', '));
    }

    client.release();

    console.log('\n✅ Database connection test PASSED');
    console.log('\n💡 Render/Railway: set DATABASE_URL to the same value you used here.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error?.message || String(error));
    process.exit(1);
  } finally {
    await pool.end().catch(() => undefined);
  }
}

main();
