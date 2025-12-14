/**
 * Verification script for Dashboard Fix Plan
 * Tests key endpoints to verify implementation
 * 
 * Usage: node scripts/verifyDashboardFix.js [baseUrl]
 * Default baseUrl: http://localhost:5000
 */

const baseUrl = process.argv[2] || 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, path, expectedHeaders = []) {
  try {
    const url = `${baseUrl}${path}`;
    log(`\nTesting: ${name}`, 'blue');
    log(`  URL: ${url}`, 'reset');
    
    const response = await fetch(url);
    const headers = Object.fromEntries(response.headers.entries());
    const body = await response.json().catch(() => ({}));
    
    log(`  Status: ${response.status} ${response.statusText}`, response.status === 200 ? 'green' : 'red');
    
    // Check expected headers
    let allHeadersPresent = true;
    for (const header of expectedHeaders) {
      const headerName = header.toLowerCase();
      const headerValue = headers[headerName];
      if (headerValue) {
        log(`  ✓ ${header}: ${headerValue}`, 'green');
      } else {
        log(`  ✗ ${header}: MISSING`, 'red');
        allHeadersPresent = false;
      }
    }
    
    // Show response body preview
    if (Object.keys(body).length > 0) {
      const bodyPreview = JSON.stringify(body).substring(0, 100);
      log(`  Body: ${bodyPreview}${bodyPreview.length >= 100 ? '...' : ''}`, 'reset');
    }
    
    return {
      success: response.status === 200 && allHeadersPresent,
      status: response.status,
      headers,
      body,
    };
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  log('=== Dashboard Fix Plan Verification ===', 'blue');
  log(`Base URL: ${baseUrl}\n`, 'reset');
  
  const results = [];
  
  // Test 1: Health endpoint
  results.push(await testEndpoint(
    'Health Check',
    '/api/health',
    ['x-aidevelo-backend-sha']
  ));
  
  // Test 2: DB Preflight
  results.push(await testEndpoint(
    'DB Preflight',
    '/api/db/preflight',
    ['x-aidevelo-backend-sha']
  ));
  
  // Test 3: Debug Env
  results.push(await testEndpoint(
    'Debug Env',
    '/api/debug/env',
    ['x-aidevelo-backend-sha']
  ));
  
  // Summary
  log('\n=== Summary ===', 'blue');
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  if (successCount === totalCount) {
    log(`✓ All ${totalCount} tests passed!`, 'green');
    process.exit(0);
  } else {
    log(`✗ ${totalCount - successCount} of ${totalCount} tests failed`, 'red');
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  log('Error: This script requires Node.js 18+ (for native fetch support)', 'red');
  log('Alternatively, install node-fetch: npm install node-fetch', 'yellow');
  process.exit(1);
}

main().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
