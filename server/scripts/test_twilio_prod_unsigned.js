const https = require('https');

const params = { CallSid: 'CA_PROD_TEST_123', From: '+41790000000' };
const postData = new URLSearchParams(params).toString();

const options = {
  hostname: 'real-aidevelo-ai.onrender.com',
  port: 443,
  path: '/api/twilio/voice/inbound',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing Production Endpoint (unsigned - should return 403)...');

const req = https.request(options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('\nResponse Body:');
    console.log(data);
    if (res.statusCode === 403) {
      console.log('\n✅ PASS: Unsigned request correctly rejected (403)');
    } else {
      console.log(`\n❌ FAIL: Expected 403, got ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
