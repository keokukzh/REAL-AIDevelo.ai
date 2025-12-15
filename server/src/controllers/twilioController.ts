import type { Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, serializeError, redact } from '../utils/logger';

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
  const enableMediaStreams = process.env.ENABLE_MEDIA_STREAMS === 'true';

  // Step 1: Upsert call_logs early to ensure locationId is available for WebSocket handler
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

  // Feature Flag: Use Media Streams if enabled, otherwise fallback to TwiML without stream
  if (enableMediaStreams) {
    // Step 3: Preconditions check
    const publicBaseUrl = process.env.PUBLIC_BASE_URL;
    const streamToken = process.env.TWILIO_STREAM_TOKEN;
    let fallbackReason: string | null = null;

    if (!publicBaseUrl) {
      fallbackReason = 'PUBLIC_BASE_URL not configured';
    } else if (!streamToken) {
      fallbackReason = 'TWILIO_STREAM_TOKEN not configured';
    } else if (!locationId) {
      fallbackReason = `locationId not resolvable for to=${to}`;
    } else {
      // Check if agent_configs.eleven_agent_id exists
      try {
        const { data: agentConfig } = await supabaseAdmin
          .from('agent_configs')
          .select('eleven_agent_id')
          .eq('location_id', locationId)
          .maybeSingle();

        if (!agentConfig?.eleven_agent_id) {
          fallbackReason = `eleven_agent_id missing for locationId=${locationId}`;
        }
      } catch (error: any) {
        fallbackReason = `Error checking agent config: ${error.message}`;
      }
    }

    if (fallbackReason) {
      logger.warn('twilio.inbound.preflight_failed', redact({
        callSid,
        locationId,
        reason: fallbackReason,
      }), req);
      const fallbackTwiml = buildTwiML(
        `  <Say voice="alice">Hello, please leave a message after the beep.</Say>\n  <Hangup />`
      );
      res.status(200).type('text/xml').send(fallbackTwiml);
      return;
    }

    // Step 2: Build TwiML with Stream Parameters
    const wsBaseUrl = getWebSocketBaseUrl(req);
    const streamUrl = `${wsBaseUrl}/api/twilio/media-stream?callSid=${encodeURIComponent(callSid)}&token=${encodeURIComponent(streamToken!)}`; // streamToken is guaranteed to exist after precondition check

    logger.info('twilio.inbound.media_streams_enabled', redact({
      callSid,
      locationId,
      streamUrl,
    }), req);

    const twiml = buildTwiML(
      `  <Connect>\n    <Stream url="${escapeXml(streamUrl)}" track="both_tracks">\n      <Parameter name="to" value="${escapeXml(to)}" />\n      <Parameter name="from" value="${escapeXml(from)}" />\n      <Parameter name="callSid" value="${escapeXml(callSid)}" />\n    </Stream>\n  </Connect>`
    );

    res
      .status(200)
      .type('text/xml')
      .send(twiml);
  } else {
    // Fallback: Simple TwiML without Media Streams
    logger.info('twilio.inbound.media_streams_disabled', redact({
      callSid,
      locationId,
    }), req);
    const fallbackTwiml = buildTwiML(
      `  <Say voice="alice">Hello, please leave a message after the beep.</Say>\n  <Hangup />`
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
