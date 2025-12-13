#!/usr/bin/env node

/**
 * Simple smoke test script
 * Tests /api/health endpoint and prints instructions
 * No secrets required - just checks if server is running
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const HEALTH_ENDPOINT = `${API_URL}/api/health`;

console.log('🧪 AIDevelo Smoke Test\n');
console.log(`Testing: ${HEALTH_ENDPOINT}\n`);

const req = http.get(HEALTH_ENDPOINT, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        if (json.ok === true) {
          console.log('✅ Health check passed');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${JSON.stringify(json)}\n`);
          console.log('📋 Next steps:');
          console.log('   1. Apply schema.sql in Supabase SQL Editor');
          console.log('   2. Set environment variables (see docs/SMOKE_TEST.md)');
          console.log('   3. Register/login at http://localhost:4000/login');
          console.log('   4. Test POST /api/agent/default (idempotent)');
          console.log('   5. Test GET /api/dashboard/overview');
          process.exit(0);
        } else {
          console.error('❌ Health check failed: Response does not have ok: true');
          console.error(`   Response: ${data}`);
          process.exit(1);
        }
      } catch (e) {
        console.error('❌ Health check failed: Invalid JSON response');
        console.error(`   Response: ${data}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Health check failed: Status ${res.statusCode}`);
      console.error(`   Response: ${data}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Health check failed: Connection error');
  console.error(`   Error: ${err.message}\n`);
  console.error('💡 Make sure the server is running:');
  console.error('   cd server && npm run dev');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('❌ Health check failed: Timeout');
  console.error('   Server did not respond within 5 seconds');
  req.destroy();
  process.exit(1);
});


