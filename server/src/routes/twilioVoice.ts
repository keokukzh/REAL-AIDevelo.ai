import { Router } from 'express';
import { twilioVoiceService } from '../services/twilioVoiceService';
import { Twilio } from 'twilio';

const router = Router();

// Initialize Twilio Client
const client = new Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

router.post('/incoming', (req, res) => {
  twilioVoiceService.handleIncomingCall(req, res);
});

router.post('/outgoing', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Missing "to" parameter' });
    }

    // Initiate outgoing call
    const call = await client.calls.create({
      url: `https://${req.headers.host}/api/twilio/voice/incoming`, // reuse incoming logic for TwiML
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
    });

    res.json({ success: true, callSid: call.sid });
  } catch (error: any) {
    console.error('Error initiating outgoing call:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/status', (req, res) => {
  const { CallSid, CallStatus } = req.body;
  console.log(`Twilio Call Status: ${CallSid} = ${CallStatus}`);
  res.sendStatus(200);
});

// The WebSocket route /stream is handled by the Upgrade listener in app.ts/voiceAgentRoutes
// We don't define a generic express handler for it here.

// Token generation for Browser Client
router.get('/token', (req, res) => {
  try {
    const { identity } = req.query;
    const AccessToken = require('twilio').jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      { identity: (identity as string) || 'user' },
    );

    const grant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true,
    });
    token.addGrant(grant);

    res.json({ token: token.toJwt() });
  } catch (error: any) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
