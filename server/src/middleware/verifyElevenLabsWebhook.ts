import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config/env';

let warnedMissingSecret = false;

/**
 * Verify ElevenLabs webhook signature
 * 
 * ElevenLabs sends webhooks with an `ElevenLabs-Signature` header in the format:
 * `t=timestamp,v0=hash`
 * 
 * The signature is computed as:
 * - message = `${timestamp}.${request_body}`
 * - hash = HMAC-SHA256(secret, message).hex()
 * 
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function verifyElevenLabsWebhook(req: Request, res: Response, next: NextFunction): void {
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET || process.env.TOOL_SHARED_SECRET;

  // Only enforce signature if webhook secret is configured
  if (!webhookSecret) {
    if (!config.isProduction) {
      if (!warnedMissingSecret) {
        warnedMissingSecret = true;
        console.warn('[ElevenLabs] ELEVENLABS_WEBHOOK_SECRET not set; skipping signature validation (development only)');
      }
      return next();
    }

    res.status(500).json({ 
      success: false, 
      error: 'ElevenLabs webhook signature validation not configured' 
    });
    return;
  }

  const signatureHeader = req.get('ElevenLabs-Signature') || req.get('elevenlabs-signature');
  
  if (!signatureHeader) {
    console.warn('[ElevenLabs] Missing signature header in webhook request');
    res.status(403).json({ 
      success: false, 
      error: 'Missing ElevenLabs signature header' 
    });
    return;
  }

  try {
    // Parse signature header: "t=timestamp,v0=hash"
    const parts = signatureHeader.split(',');
    let timestamp: string | undefined;
    let receivedHash: string | undefined;

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v0') {
        receivedHash = value;
      }
    }

    if (!timestamp || !receivedHash) {
      console.warn('[ElevenLabs] Invalid signature header format:', signatureHeader);
      res.status(403).json({ 
        success: false, 
        error: 'Invalid signature header format' 
      });
      return;
    }

    // Validate timestamp (prevent replay attacks)
    const timestampInt = parseInt(timestamp, 10);
    if (isNaN(timestampInt)) {
      console.warn('[ElevenLabs] Invalid timestamp in signature:', timestamp);
      res.status(403).json({ 
        success: false, 
        error: 'Invalid timestamp in signature' 
      });
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTime - timestampInt);
    const maxAge = 30 * 60; // 30 minutes

    if (timeDifference > maxAge) {
      console.warn('[ElevenLabs] Webhook timestamp too old or too far in future:', {
        timestamp: timestampInt,
        currentTime,
        difference: timeDifference,
      });
      res.status(403).json({ 
        success: false, 
        error: 'Webhook timestamp outside acceptable range' 
      });
      return;
    }

    // Get raw request body
    // Note: Express body-parser may have already parsed it, so we need to reconstruct it
    // For HMAC verification, we need the exact raw body as sent by ElevenLabs
    // If body was parsed, we stringify it back (must match exactly what ElevenLabs sent)
    let rawBody: string;
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (Buffer.isBuffer((req as any).rawBody)) {
      // If rawBody was preserved (requires special middleware), use it
      rawBody = (req as any).rawBody.toString('utf8');
    } else {
      // Fallback: stringify parsed body (should match original if JSON)
      rawBody = JSON.stringify(req.body);
    }

    // Compute expected signature
    // Message format: `${timestamp}.${request_body}`
    const message = `${timestamp}.${rawBody}`;
    const computedHash = createHmac('sha256', webhookSecret)
      .update(message, 'utf8')
      .digest('hex');

    // Compare signatures using timing-safe comparison
    const receivedHashBuffer = Buffer.from(receivedHash, 'hex');
    const computedHashBuffer = Buffer.from(computedHash, 'hex');

    if (receivedHashBuffer.length !== computedHashBuffer.length) {
      console.warn('[ElevenLabs] Signature length mismatch');
      res.status(403).json({ 
        success: false, 
        error: 'Invalid webhook signature' 
      });
      return;
    }

    if (!timingSafeEqual(receivedHashBuffer, computedHashBuffer)) {
      console.warn('[ElevenLabs] Signature verification failed', {
        receivedHash: receivedHash.substring(0, 16) + '...',
        computedHash: computedHash.substring(0, 16) + '...',
      });
      res.status(403).json({ 
        success: false, 
        error: 'Invalid webhook signature' 
      });
      return;
    }

    // Signature verified
    console.log('[ElevenLabs] Webhook signature verified successfully');
    next();
  } catch (error) {
    console.error('[ElevenLabs] Error verifying webhook signature:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error verifying webhook signature' 
    });
  }
}
