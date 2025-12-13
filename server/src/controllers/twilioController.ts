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

export function handleInboundVoice(req: Request, res: Response): void {
  // Minimal default: acknowledge and hang up.
  const sayText = 'Vielen Dank. Bitte bleiben Sie kurz dran.';

  const twiml = buildTwiML(`  <Say language="de-CH">${escapeXml(sayText)}</Say>\n  <Hangup/>`);

  res
    .status(200)
    .type('text/xml')
    .send(twiml);
}

export function handleVoiceStatusCallback(req: Request, res: Response): void {
  // Intentionally do not log payload; can include phone numbers and call SIDs.
  res.status(204).send();
}
