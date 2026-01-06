import { Request, Response } from 'express';
import { createRetellSession } from '../services/retellService';

export async function createSessionHandler(req: Request, res: Response) {
  try {
    const payload = req.body || {};
    const data = await createRetellSession(payload);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('[retell] createSession error', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal error' });
  }
}

export async function webhookHandler(req: Request, res: Response) {
  // Basic webhook receiver — user should validate signature in production
  console.log('[retell] webhook', req.path, req.body);
  return res.status(200).json({ success: true });
}
