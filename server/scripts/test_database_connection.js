const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:QPonMlqp8RAuw6GO@db.rckuwfcsqwwylffecwur.supabase.co:5432/postgres';

console.log('🔌 Testing Supabase Database Connection...');
console.log('📍 Connection:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Supabase uses self-signed certs
  },
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    console.log('⏳ Connecting...');
    const client = await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Test query
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('\n📊 Database Info:');
    console.log('  PostgreSQL Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    console.log('  Database:', result.rows[0].current_database);
    console.log('  User:', result.rows[0].current_user);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `);
    
    console.log('\n📋 Tables in database:', tablesResult.rows.length);
    if (tablesResult.rows.length > 0) {
      console.log('  Sample tables:', tablesResult.rows.slice(0, 5).map(r => r.table_name).join(', '));
    }
    
    client.release();
    console.log('\n✅ Database connection test PASSED');
    console.log('\n💡 This DATABASE_URL is valid for Render:');
    console.log('   postgresql://postgres:QPonMlqp8RAuw6GO@db.rckuwfcsqwwylffecwur.supabase.co:5432/postgres');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   → DNS resolution failed. Check if the hostname is correct.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   → Connection timeout. Check firewall/network settings.');
    } else if (error.message.includes('password authentication failed')) {
      console.error('   → Password incorrect. Check your Supabase database password.');
    } else if (error.message.includes('does not exist')) {
      console.error('   → Database does not exist. Check database name.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
