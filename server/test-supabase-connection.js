/**
 * Test Supabase (Postgres) database connection via DATABASE_URL.
 *
 * Usage:
 *   - PowerShell:  $env:DATABASE_URL='postgresql://...'; node test-supabase-connection.js
 *   - Bash:       DATABASE_URL='postgresql://...' node test-supabase-connection.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

function maskDatabaseUrl(url) {
  if (!url) return '(not set)';
  // Replace ":password@" with ":****@" (best-effort)
  return url.replace(/:(?!\/\/)[^:@/]+@/g, ':****@');
}

async function testConnection() {
  if (!DATABASE_URL) {
    console.error('❌ Missing env var: DATABASE_URL');
    console.error('   Set it from Supabase Dashboard → Settings → Database → Connection string');
    console.error('   Example: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
    process.exit(1);
  }

  console.log('🔌 Testing Supabase database connection...');
  console.log('📍 Connection:', maskDatabaseUrl(DATABASE_URL));

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('⏳ Connecting...');
    const client = await pool.connect();

    console.log('✅ Connected successfully!');

    const result = await client.query('SELECT NOW() as now, version() as version');
    console.log('📊 Server Time:', result.rows[0].now);
    console.log('📊 PostgreSQL Version:', String(result.rows[0].version).split(' ')[0]);

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
      LIMIT 20;
    `);

    console.log('\n📋 Tables (up to 20):');
    if (tablesResult.rows.length === 0) {
      console.log('   (No tables found - migrations may be needed)');
    } else {
      tablesResult.rows.forEach((row) => console.log(`   - ${row.table_name}`));
    }

    client.release();
    console.log('\n✅ Connection test successful!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error?.message || String(error));
    console.error('Code:', error?.code);

    if (error?.code === 'ETIMEDOUT') {
      console.error('\n💡 Tip: If you are using the pooler, try the direct connection on port 5432.');
    } else if (error?.code === '28P01') {
      console.error('\n💡 Tip: Password authentication failed. Verify the DATABASE_URL password.');
    } else if (error?.code === 'ENOTFOUND') {
      console.error('\n💡 Tip: Hostname not found. Verify the project ref / region.');
    }

    process.exit(1);
  } finally {
    await pool.end().catch(() => undefined);
  }
}

testConnection();
