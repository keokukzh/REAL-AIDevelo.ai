const crypto = require('crypto');
const http = require('http');

function computeTwilioSignature(authToken, url, params) {
  const pairs = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      pairs.push([key, String(value)]);
    }
  }
  pairs.sort(([aKey, aVal], [bKey, bVal]) => {
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
  const data = url + pairs.map(([k, v]) => `${k}${v}`).join('');
  return crypto.createHmac('sha1', authToken).update(data, 'utf8').digest('base64');
}

const url = 'http://localhost:10000/api/twilio/voice/inbound';
const params = { CallSid: 'CA_TEST_123', From: '+41790000000' };
const authToken = 'test_auth_token';
const signature = computeTwilioSignature(authToken, url, params);

const postData = new URLSearchParams(params).toString();

const options = {
  hostname: 'localhost',
  port: 10000,
  path: '/api/twilio/voice/inbound',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Twilio-Signature': signature,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('\nResponse Body:');
    console.log(data);
    if (res.statusCode === 200 && data.includes('<Stream')) {
      console.log('\n✅ PASS: TwiML contains <Stream>');
    } else if (res.statusCode === 500) {
      console.log('\n❌ FAIL: Server error (check TWILIO_STREAM_TOKEN)');
    } else {
      console.log('\n❌ FAIL: Unexpected response');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
