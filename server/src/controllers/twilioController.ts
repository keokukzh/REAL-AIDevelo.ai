import type { Request, Response } from 'express';

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

export function handleVoiceStatusCallback(req: Request, res: Response): void {
  // Intentionally do not log payload; can include phone numbers and call SIDs.
  res.status(204).send();
}
