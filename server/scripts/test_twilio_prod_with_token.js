const crypto = require('crypto');
const https = require('https');

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

// Production URL
const url = 'https://real-aidevelo-ai.onrender.com/api/twilio/voice/inbound';
const params = { CallSid: 'CA_PROD_TEST_456', From: '+41790000000' };

// TWILIO_AUTH_TOKEN from environment
const authToken = process.env.TWILIO_AUTH_TOKEN;
if (!authToken) {
  console.error('❌ TWILIO_AUTH_TOKEN not set in environment');
  process.exit(1);
}

const signature = computeTwilioSignature(authToken, url, params);
const postData = new URLSearchParams(params).toString();

const options = {
  hostname: 'real-aidevelo-ai.onrender.com',
  port: 443,
  path: '/api/twilio/voice/inbound',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Twilio-Signature': signature,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing Production Endpoint (after TWILIO_STREAM_TOKEN set in Render)...');
console.log(`URL: ${url}`);

const req = https.request(options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log(`x-aidevelo-proxy: ${res.headers['x-aidevelo-proxy'] || 'not set'}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('\nResponse Body:');
    if (res.statusCode === 200) {
      // Mask token in URL if present
      const masked = data.replace(/token=([^"&<>]+)/g, 'token=***MASKED***');
      console.log(masked);
      
      if (data.includes('<Connect>') && data.includes('<Stream')) {
        console.log('\n✅ PASS: TwiML contains <Connect><Stream>');
        console.log('✅ Production is now using Media Streams!');
      } else if (data.includes('<Say') && data.includes('<Hangup')) {
        console.log('\n❌ FAIL: Still returning <Say><Hangup> (old code or TWILIO_STREAM_TOKEN not active)');
      } else {
        console.log('\n⚠️  WARNING: Unexpected TwiML format');
      }
    } else if (res.statusCode === 500) {
      console.log(data);
      console.log('\n❌ FAIL: Server error - check if TWILIO_STREAM_TOKEN is correctly set in Render');
    } else if (res.statusCode === 403) {
      console.log(data);
      console.log('\n❌ FAIL: Signature validation failed');
    } else {
      console.log(data);
      console.log(`\n❌ FAIL: Unexpected status ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
