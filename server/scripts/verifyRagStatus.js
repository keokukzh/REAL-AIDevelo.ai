/**
 * Verification script for RAG Status Endpoint
 * Tests the /api/v1/rag/status endpoint
 *
 * Usage: node scripts/verifyRagStatus.js [baseUrl]
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

async function verifyRagStatus() {
  const url = `${baseUrl}/api/v1/rag/status`;
  log(`Testing ${url}...`, 'blue');

  try {
    // Note: This endpoint requires auth.
    // If DEV_BYPASS_AUTH=true is set on server, we might be able to call it.
    // Otherwise we expect 401, which confirms the route exists.

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    log(`Status: ${response.status}`, response.status === 200 ? 'green' : 'yellow');

    if (response.status === 200) {
      const body = await response.json();
      log('Response body:', 'reset');
      console.log(JSON.stringify(body, null, 2));

      if (body.success && body.data) {
        log('✓ Endpoint structure is correct', 'green');
        if (body.data.connected) {
          log('✓ Vector Store is CONNECTED', 'green');
        } else {
          log('! Vector Store is NOT CONNECTED (check Qdrant)', 'yellow');
        }
      } else {
        log('✗ Unexpected response structure', 'red');
      }
    } else if (response.status === 401) {
      log('✓ Endpoint exists (401 Unauthorized)', 'green');
      log('! To verify payload, ensure a valid token or DEV_BYPASS_AUTH is used.', 'yellow');
    } else {
      log(`✗ Unexpected status code: ${response.status}`, 'red');
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.cause) console.error(error.cause);
  }
}

verifyRagStatus();
