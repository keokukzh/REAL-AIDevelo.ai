import express from 'express';
import { handleInboundVoice, handleVoiceStatusCallback } from '../controllers/twilioController';
import { verifyTwilioSignature } from '../middleware/verifyTwilioSignature';

const router = express.Router();

// Twilio sends application/x-www-form-urlencoded by default.
router.use(express.urlencoded({ extended: false }));

router.post('/voice/inbound', verifyTwilioSignature, handleInboundVoice);
router.post('/voice/status', verifyTwilioSignature, handleVoiceStatusCallback);

export default router;
