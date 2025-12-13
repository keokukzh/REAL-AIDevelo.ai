/*
  Local Twilio Media Streams simulator.

  Usage:
    set TWILIO_STREAM_TOKEN=... (must match server)
    set PORT=5000 (or whatever the server uses)
    node server/scripts/simulateTwilioMediaStream.js

  This script:
    - connects to ws://localhost:<PORT>/ws/twilio/stream?token=...
    - prints the HTTP upgrade status (expects 101)
    - sends start/media/stop events
*/

const WebSocket = require('ws');

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing ${name} in environment`);
  }
  return v;
}

const token = requireEnv('TWILIO_STREAM_TOKEN');
const port = process.env.PORT || '5000';

const url = `ws://localhost:${port}/ws/twilio/stream?token=${encodeURIComponent(token)}`;

const ws = new WebSocket(url);

ws.on('upgrade', (res) => {
  console.log(`[sim] upgrade status=${res.statusCode}`);
});

ws.on('open', () => {
  console.log('[sim] open');

  const streamSid = 'MZ_SIM_STREAM_SID';
  const callSid = 'CA_SIM_CALL_SID';

  ws.send(
    JSON.stringify({
      event: 'start',
      start: { streamSid, callSid },
    })
  );

  // Send a few fake "audio" frames (base64)
  for (let i = 0; i < 3; i++) {
    const pcm = Buffer.alloc(160, i); // arbitrary bytes
    ws.send(
      JSON.stringify({
        event: 'media',
        media: {
          payload: pcm.toString('base64'),
        },
      })
    );
  }

  ws.send(
    JSON.stringify({
      event: 'stop',
      stop: { streamSid, callSid },
    })
  );
});

ws.on('close', (code, reason) => {
  console.log(`[sim] close code=${code} reason=${reason ? reason.toString() : ''}`);
});

ws.on('error', (err) => {
  console.error('[sim] error', err);
  process.exitCode = 1;
});
