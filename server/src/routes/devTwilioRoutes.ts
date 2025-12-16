import { Router, Request, Response, NextFunction } from 'express';
import { InternalServerError, BadRequestError } from '../utils/errors';
import { supabaseAdmin } from '../services/supabaseDb';
import { config } from '../config/env';

const router = Router();

/**
 * Dev-only endpoints for testing Twilio integration
 * Only available when NODE_ENV !== 'production'
 */
if (process.env.NODE_ENV !== 'production') {
  /**
   * POST /api/dev/twilio/test-webhook
   * Test Twilio webhook handling
   */
  router.post('/test-webhook', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { callSid, from, to, locationId } = req.body;

      if (!callSid || !from || !to) {
        return next(new BadRequestError('callSid, from, and to are required'));
      }

      // Test locationId resolution
      let resolvedLocationId = locationId;
      if (!resolvedLocationId && to) {
        const { data: phoneData } = await supabaseAdmin
          .from('phone_numbers')
          .select('location_id')
          .or(`e164.eq.${to},customer_public_number.eq.${to}`)
          .limit(1)
          .maybeSingle();

        resolvedLocationId = phoneData?.location_id || null;
      }

      // Check if agent config exists
      let agentConfig = null;
      if (resolvedLocationId) {
        const { data: config } = await supabaseAdmin
          .from('agent_configs')
          .select('id, eleven_agent_id, setup_state')
          .eq('location_id', resolvedLocationId)
          .maybeSingle();

        agentConfig = config;
      }

      // Check environment variables
      const envCheck = {
        TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: !!config.twilioAuthToken,
        TWILIO_STREAM_TOKEN: !!config.twilioStreamToken,
        PUBLIC_BASE_URL: !!config.publicBaseUrl,
        ENABLE_MEDIA_STREAMS: process.env.ENABLE_MEDIA_STREAMS === 'true',
      };

      res.json({
        success: true,
        data: {
          callSid,
          from,
          to,
          locationId: resolvedLocationId,
          agentConfig: agentConfig ? {
            id: agentConfig.id,
            elevenAgentId: agentConfig.eleven_agent_id,
            setupState: agentConfig.setup_state,
          } : null,
          environment: envCheck,
          webhookUrl: config.publicBaseUrl ? `${config.publicBaseUrl}/api/twilio/voice/inbound` : null,
          mediaStreamUrl: config.publicBaseUrl && config.twilioStreamToken
            ? `${config.publicBaseUrl.replace(/^https?:/, 'wss:')}/api/twilio/media-stream?callSid=${callSid}&token=${config.twilioStreamToken}`
            : null,
        },
      });
    } catch (error: any) {
      console.error('[DevTwilioRoutes] Error in test-webhook:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });

  /**
   * GET /api/dev/twilio/test-twiml
   * Test TwiML generation
   */
  router.get('/test-twiml', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { callSid, from, to, locationId } = req.query;

      if (!callSid || !from || !to) {
        return next(new BadRequestError('callSid, from, and to query parameters are required'));
      }

      // Resolve locationId if not provided
      let resolvedLocationId = locationId as string | null;
      if (!resolvedLocationId) {
        const { data: phoneData } = await supabaseAdmin
          .from('phone_numbers')
          .select('location_id')
          .or(`e164.eq.${to},customer_public_number.eq.${to}`)
          .limit(1)
          .maybeSingle();

        resolvedLocationId = phoneData?.location_id || null;
      }

      // Check if Media Streams can be enabled
      const enableMediaStreams = process.env.ENABLE_MEDIA_STREAMS === 'true';
      const canEnableMediaStreams = enableMediaStreams &&
        !!config.publicBaseUrl &&
        !!config.twilioStreamToken &&
        !!resolvedLocationId;

      // Check agent config
      let hasAgentId = false;
      if (resolvedLocationId) {
        const { data: agentConfig } = await supabaseAdmin
          .from('agent_configs')
          .select('eleven_agent_id')
          .eq('location_id', resolvedLocationId)
          .maybeSingle();

        hasAgentId = !!agentConfig?.eleven_agent_id;
      }

      // Generate TwiML
      let twiml: string;
      if (canEnableMediaStreams && hasAgentId) {
        const wsBaseUrl = (config.publicBaseUrl || '').replace(/^https?:/, 'wss:').replace(/\/$/, '');
        const streamUrl = `${wsBaseUrl}/api/twilio/media-stream?callSid=${encodeURIComponent(String(callSid))}&token=${encodeURIComponent(config.twilioStreamToken!)}`;
        
        function escapeXml(value: string): string {
          return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        }

        const toStr = String(to);
        const fromStr = String(from);
        const callSidStr = String(callSid);

        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(streamUrl)}" track="both_tracks">
      <Parameter name="to" value="${escapeXml(toStr)}" />
      <Parameter name="from" value="${escapeXml(fromStr)}" />
      <Parameter name="callSid" value="${escapeXml(callSidStr)}" />
    </Stream>
  </Connect>
</Response>`;
      } else {
        // Fallback TwiML
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, please leave a message after the beep.</Say>
  <Hangup />
</Response>`;
      }

      res.type('text/xml').send(twiml);
    } catch (error: any) {
      console.error('[DevTwilioRoutes] Error in test-twiml:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });
}

export default router;
