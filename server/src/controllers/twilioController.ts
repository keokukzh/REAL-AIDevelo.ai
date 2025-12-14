import type { Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseDb';

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

export function handleInboundVoice(req: Request, res: Response): void {
  const streamToken = process.env.TWILIO_STREAM_TOKEN;
  if (!streamToken) {
    res.status(500).json({ success: false, error: 'TWILIO_STREAM_TOKEN not configured' });
    return;
  }

  const wsBaseUrl = getWebSocketBaseUrl(req);
  const streamUrl = `${wsBaseUrl}/ws/twilio/stream?token=${encodeURIComponent(streamToken)}`;

  const twiml = buildTwiML(
    `  <Connect>\n    <Stream url="${escapeXml(streamUrl)}" />\n  </Connect>`
  );

  res
    .status(200)
    .type('text/xml')
    .send(twiml);
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
    await supabaseAdmin
      .from('call_logs')
      .update(callData)
      .eq('id', existingCall.id);
  } else {
    // Create new call log
    await supabaseAdmin.from('call_logs').insert(callData);
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
      console.error('[TwilioController] Error persisting call event:', error);
    }
  }
}
