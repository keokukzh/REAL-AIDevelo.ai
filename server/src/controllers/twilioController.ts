import type { Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, serializeError, redact } from '../utils/logger';
import axios from 'axios';
import { config } from '../config/env';
import { loadConversationInitContext, buildConversationInitData } from '../voice-agent/utils/conversationInitBuilder';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildTwiML(xmlBody: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${xmlBody}\n</Response>`;
}

function getWebSocketBaseUrl(req: Request): string {
  const publicBaseUrl = process.env.PUBLIC_BASE_URL;
  const base = (publicBaseUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  return base.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
}

export async function handleInboundVoice(req: Request, res: Response): Promise<void> {
  const callSid = req.body.CallSid || 'unknown';
  const from = req.body.From || '';
  const to = req.body.To || '';

  // Step 1: Upsert call_logs early to ensure locationId is available
  let locationId: string | null = null;
  try {
    if (to) {
      const { data: phoneData } = await supabaseAdmin
        .from('phone_numbers')
        .select('location_id')
        .or(`e164.eq.${to},customer_public_number.eq.${to}`)
        .limit(1)
        .maybeSingle();

      locationId = phoneData?.location_id || null;

      if (locationId) {
        // Upsert call_logs entry
        const timestamp = req.body.Timestamp ? new Date(req.body.Timestamp).toISOString() : new Date().toISOString();
        const callData: any = {
          location_id: locationId,
          call_sid: callSid,
          direction: 'inbound',
          from_e164: from || null,
          to_e164: to || null,
          started_at: timestamp,
          outcome: 'ringing', // Initial status
          notes_json: {
            status: 'ringing',
            timestamp,
          },
        };

        // Check if call log already exists
        const { data: existingCall } = await supabaseAdmin
          .from('call_logs')
          .select('id')
          .eq('call_sid', callSid)
          .maybeSingle();

        if (existingCall) {
          const { error: updateError } = await supabaseAdmin
            .from('call_logs')
            .update(callData)
            .eq('id', existingCall.id);
          if (updateError) {
            logger.error('twilio.inbound.call_log_update_failed', updateError, redact({
              callSid,
              locationId,
            }), req);
          }
        } else {
          const { error: insertError } = await supabaseAdmin.from('call_logs').insert(callData);
          if (insertError) {
            logger.error('twilio.inbound.call_log_insert_failed', insertError, redact({
              callSid,
              locationId,
            }), req);
          }
        }

        logger.info('twilio.inbound.call_log_upserted', redact({
          callSid,
          locationId,
          to,
        }), req);
      }
    }
  } catch (error: any) {
    logger.error('twilio.inbound.call_log_upsert_failed', error, redact({
      callSid,
      to,
      from,
    }), req);
    // Continue even if call log upsert fails
  }

  // Step 2: Use ElevenLabs register-call (replaces Media Streams)
  // This is the canonical approach per Stop Conditions: register-call must return TwiML
  
  // Check for mock mode
  if (process.env.ELEVENLABS_MOCK_MODE === 'true') {
    const { getMockTwiML } = await import('../services/mockElevenLabsService');
    logger.info('twilio.inbound.mock_mode', redact({
      callSid,
      locationId,
    }), req);
    const mockTwiml = getMockTwiML();
    res.status(200).type('text/xml').send(mockTwiml);
    return;
  }
  
  // Preconditions check
  if (!locationId) {
    logger.warn('twilio.inbound.location_not_resolved', redact({
      callSid,
      to,
      from,
    }), req);
    const fallbackTwiml = buildTwiML(
      `  <Say voice="alice">Entschuldigung, die Verbindung konnte nicht hergestellt werden. Bitte versuchen Sie es später erneut.</Say>\n  <Hangup />`
    );
    res.status(200).type('text/xml').send(fallbackTwiml);
    return;
  }

  // Check ElevenLabs API key
  const elevenLabsApiKey = config.elevenLabsApiKey;
  if (!elevenLabsApiKey || !config.isElevenLabsConfigured) {
    logger.error('twilio.inbound.elevenlabs_not_configured', new Error('ELEVENLABS_API_KEY not configured'), redact({
      callSid,
      locationId,
    }), req);
    const fallbackTwiml = buildTwiML(
      `  <Say voice="alice">Entschuldigung, der Service ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.</Say>\n  <Hangup />`
    );
    res.status(200).type('text/xml').send(fallbackTwiml);
    return;
  }

  try {
    // Load conversation initiation context
    const initContext = await loadConversationInitContext(locationId, {
      from,
      to,
      callSid,
      testMode: false,
    });

    // Get agent ID (required for register-call)
    const agentId = initContext.agentConfig.eleven_agent_id || process.env.ELEVENLABS_AGENT_ID_DEFAULT || 'agent_1601kcmqt4efe41bzwykaytm2yrj';
    
    if (!agentId) {
      throw new Error('ElevenLabs Agent ID not found');
    }

    // Build conversation initiation data
    const conversationInitData = await buildConversationInitData(initContext);

    // Call ElevenLabs register-call API
    logger.info('twilio.inbound.registering_call', redact({
      callSid,
      locationId,
      agentId,
      from,
      to,
    }), req);

    const registerCallResponse = await axios.post(
      'https://api.elevenlabs.io/v1/convai/twilio/register-call',
      {
        agent_id: agentId,
        from_number: from,
        to_number: to,
        direction: 'inbound',
        conversation_initiation_client_data: conversationInitData,
      },
      {
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    // Track character costs from response headers (per API reference)
    const { extractElevenLabsCosts } = await import('../utils/elevenLabsCostTracking');
    extractElevenLabsCosts(registerCallResponse, 'convai/twilio/register-call');

    // ElevenLabs returns TwiML directly as text/xml
    const twiml = registerCallResponse.data;

    if (typeof twiml !== 'string' || !twiml.includes('<Response>')) {
      logger.error('twilio.inbound.invalid_twiml_response', new Error('Invalid TwiML from ElevenLabs'), redact({
        callSid,
        locationId,
        responseType: typeof twiml,
        responsePreview: String(twiml).substring(0, 200),
      }), req);
      throw new Error('Invalid TwiML response from ElevenLabs');
    }

    logger.info('twilio.inbound.register_call_success', redact({
      callSid,
      locationId,
      agentId,
      twimlLength: twiml.length,
    }), req);

    // Return TwiML directly to Twilio
    res.status(200).type('text/xml').send(twiml);
  } catch (error: any) {
    logger.error('twilio.inbound.register_call_failed', error, redact({
      callSid,
      locationId,
      from,
      to,
      errorMessage: error.message,
      errorStatus: axios.isAxiosError(error) ? error.response?.status : undefined,
    }), req);

    // Fallback TwiML on error
    const fallbackTwiml = buildTwiML(
      `  <Say voice="alice">Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.</Say>\n  <Hangup />`
    );
    res.status(200).type('text/xml').send(fallbackTwiml);
  }
}

async function persistCallEvent(callSid: string, req: Request): Promise<void> {
  const callStatus = req.body.CallStatus;
  const from = req.body.From;
  const to = req.body.To;
  const direction = req.body.Direction; // 'inbound' or 'outbound'
  const duration = req.body.CallDuration ? Number.parseInt(req.body.CallDuration, 10) : null;

  // Find location by phone number
  const phoneNumber = direction === 'inbound' ? to : from;
  
  const { data: phoneData } = await supabaseAdmin
    .from('phone_numbers')
    .select('location_id')
    .or(`e164.eq.${phoneNumber},customer_public_number.eq.${phoneNumber}`)
    .limit(1)
    .maybeSingle();

  if (!phoneData?.location_id) {
    return;
  }

  // Check if call log already exists
  const { data: existingCall } = await supabaseAdmin
    .from('call_logs')
    .select('id')
    .eq('call_sid', callSid)
    .maybeSingle();

  const timestamp = req.body.Timestamp ? new Date(req.body.Timestamp).toISOString() : new Date().toISOString();
  const callData: any = {
    location_id: phoneData.location_id,
    call_sid: callSid,
    direction: direction || (from && to ? 'inbound' : 'outbound'),
    from_e164: from || null,
    to_e164: to || null,
    started_at: timestamp,
    outcome: callStatus || null,
    notes_json: {
      status: callStatus,
      timestamp,
    },
  };

  const isCompleted = callStatus === 'completed';
  const isTerminated = isCompleted || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer';

  if (isCompleted && duration !== null) {
    callData.duration_sec = duration;
    callData.ended_at = new Date().toISOString();
  } else if (isTerminated) {
    callData.ended_at = new Date().toISOString();
  }

  if (existingCall) {
    // Update existing call log
    const { error: updateError } = await supabaseAdmin
      .from('call_logs')
      .update(callData)
      .eq('id', existingCall.id);

    if (updateError) {
      logger.error('twilio.status.call_log_update_failed', updateError, redact({
        callSid,
        locationId: phoneData.location_id,
        callStatus,
      }), req);
    } else {
      logger.info('twilio.status.call_log_updated', redact({
        callSid,
        callStatus,
        locationId: phoneData.location_id,
        updatedFields: Object.keys(callData),
      }), req);
    }
  } else {
    // Create new call log
    const { error: insertError } = await supabaseAdmin.from('call_logs').insert(callData);

    if (insertError) {
      logger.error('twilio.status.call_log_create_failed', insertError, redact({
        callSid,
        locationId: phoneData.location_id,
        callStatus,
      }), req);
    } else {
      logger.info('twilio.status.call_log_created', redact({
        callSid,
        callStatus,
        locationId: phoneData.location_id,
      }), req);
    }
  }
}

export async function handleVoiceStatusCallback(req: Request, res: Response): Promise<void> {
  // Twilio sends status updates as form-encoded data
  const callSid = req.body.CallSid;

  // Respond immediately (don't wait for DB operation)
  res.status(204).send();

  // Persist call event asynchronously
  if (callSid) {
    try {
      await persistCallEvent(callSid, req);
    } catch (error) {
      // Log error but don't fail the webhook response
      logger.error('twilio.status.persist_event_failed', error, redact({
        callSid,
      }), req);
    }
  }
}
