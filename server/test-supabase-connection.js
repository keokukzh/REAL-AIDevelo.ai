/**
 * Test Supabase Database Connection
 * Run: node test-supabase-connection.js
 */

const { Pool } = require('pg');

// Supabase Connection String - Direct Connection (Port 5432)
const DATABASE_URL = 'postgresql://postgres:jfH5dLfhBhdvQvIq@db.pdxdgfxhpyefqyouotat.supabase.co:5432/postgres';

// Alternative: Pooled Connection (if direct doesn't work)
// const DATABASE_URL = 'postgresql://postgres.pdxdgfxhpyefqyouotat:jfH5dLfhBhdvQvIq@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  console.log('📍 Connection:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Supabase pooler may use self-signed certs
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('⏳ Connecting...');
    const client = await pool.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await client.query('SELECT NOW() as now, version() as version');
    console.log('📊 Server Time:', result.rows[0].now);
    console.log('📊 PostgreSQL Version:', result.rows[0].version.split(' ')[0]);
    
    // Check if migrations table exists
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Existing Tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   (No tables found - migrations needed)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    client.release();
    console.log('\n✅ Connection test successful!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Tip: Try using the direct connection (port 5432) instead of pooled (6543)');
    } else if (error.code === '28P01') {
      console.error('\n💡 Tip: Check if the password is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Tip: Check if the hostname is correct. Region might be different.');
      console.error('   Check Supabase Dashboard → Settings → Database → Connection Pooling');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();

