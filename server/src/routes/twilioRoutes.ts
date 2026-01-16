import express from 'express';
import { handleInboundVoice, handleVoiceStatusCallback } from '../controllers/twilioController';
import { handleWhatsAppInbound } from '../controllers/twilioWhatsAppController';
import { verifyTwilioSignature } from '../middleware/verifyTwilioSignature';

const router = express.Router();

// Twilio sends application/x-www-form-urlencoded by default.
router.use(express.urlencoded({ extended: false }));

router.post('/voice/inbound', verifyTwilioSignature, handleInboundVoice);
router.post('/voice/incoming', verifyTwilioSignature, handleInboundVoice); // Alias for compatibility
router.post('/voice/status', verifyTwilioSignature, handleVoiceStatusCallback);
router.post('/whatsapp/inbound', verifyTwilioSignature, handleWhatsAppInbound);

router.get('/numbers', async (req, res) => {
  const { twilioService } = await import('../services/twilioService');
  try {
    const numbers = await twilioService.listPhoneNumbers('US');
    res.json({ success: true, data: numbers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
