import { Request, Response } from 'express';
import { agentCore } from '../core/agent/agentCore';
import { conversationRepository } from '../core/conversations/conversationRepository';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, redact } from '../utils/logger';

/**
 * Escape XML for TwiML
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build TwiML MessagingResponse
 */
function buildTwiMLMessage(message: string): string {
  const escapedMessage = escapeXml(message);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message>${escapedMessage}</Message>\n</Response>`;
}

/**
 * POST /api/twilio/whatsapp/inbound
 * Twilio WhatsApp inbound webhook handler
 */
export async function handleWhatsAppInbound(req: Request, res: Response): Promise<void> {
  const from = req.body.From || '';
  const to = req.body.To || '';
  const body = req.body.Body || '';
  const messageSid = req.body.MessageSid || '';

  // Always respond with TwiML (even on errors) to prevent Twilio retries
  const sendTwiML = (message: string) => {
    res.status(200).type('text/xml').send(buildTwiMLMessage(message));
  };

  // Validate required fields
  if (!from || !to || !body || !messageSid) {
    logger.warn('whatsapp.inbound.missing_fields', redact({
      hasFrom: !!from,
      hasTo: !!to,
      hasBody: !!body,
      hasMessageSid: !!messageSid,
    }), req);
    sendTwiML('Entschuldigung, die Nachricht konnte nicht verarbeitet werden.');
    return;
  }

  try {
    // Step 1: Resolve locationId from To number (whatsapp:+41...)
    // Normalize To: remove 'whatsapp:' prefix if present
    const normalizedTo = to.replace(/^whatsapp:/, '');
    
    const { data: channelsConfig, error: configError } = await supabaseAdmin
      .from('channels_config')
      .select('location_id, whatsapp_enabled')
      .or(`whatsapp_to.eq.${to},whatsapp_to.eq.whatsapp:${normalizedTo},whatsapp_to.eq.${normalizedTo}`)
      .maybeSingle();

    if (configError) {
      logger.error('whatsapp.inbound.config_lookup_failed', configError, redact({
        to,
        normalizedTo,
      }), req);
      sendTwiML('Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      return;
    }

    if (!channelsConfig) {
      logger.warn('whatsapp.inbound.location_not_found', redact({
        to,
        normalizedTo,
      }), req);
      sendTwiML('Entschuldigung, diese Nummer ist nicht konfiguriert.');
      return;
    }

    if (channelsConfig.whatsapp_enabled === false) {
      logger.warn('whatsapp.inbound.disabled', redact({
        locationId: channelsConfig.location_id,
      }), req);
      sendTwiML('WhatsApp ist für diesen Standort deaktiviert.');
      return;
    }

    // Step 2: Check idempotency (prevent duplicate processing)
    const messageExists = await conversationRepository.messageExists('whatsapp', messageSid);
    if (messageExists) {
      logger.info('whatsapp.inbound.duplicate_message', redact({
        messageSid,
        locationId: channelsConfig.location_id,
      }), req);
      // Return empty or acknowledgment message (Twilio expects 200)
      sendTwiML(''); // Empty message is valid TwiML
      return;
    }

    // Step 3: Normalize external user ID (use From number)
    const externalUserId = `whatsapp:${from}`;

    // Step 4: Call AgentCore
    const response = await agentCore.handleMessage({
      locationId: channelsConfig.location_id,
      channel: 'whatsapp',
      externalUserId,
      text: body.trim(),
      externalMessageId: messageSid,
      metadata: {
        from,
        to,
        messageSid,
      },
    });

    // Step 5: Send TwiML response
    // WhatsApp has a 4096 character limit per message
    let replyText = response.text;
    if (replyText.length > 4000) {
      replyText = replyText.substring(0, 4000) + '...';
      logger.warn('whatsapp.inbound.message_truncated', redact({
        locationId: channelsConfig.location_id,
        originalLength: response.text.length,
      }), req);
    }

    sendTwiML(replyText);

    logger.info('whatsapp.inbound.message_handled', redact({
      locationId: channelsConfig.location_id,
      messageSid,
      from,
      to,
      bodyLength: body.length,
      responseLength: replyText.length,
    }), req);
  } catch (error: any) {
    logger.error('whatsapp.inbound.handle_failed', error, redact({
      from,
      to,
      messageSid,
      bodyLength: body.length,
    }), req);

    // Always respond with TwiML (even on error) to prevent Twilio retries
    sendTwiML('Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
  }
}
