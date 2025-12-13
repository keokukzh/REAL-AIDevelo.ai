import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';

let warnedMissingAuthToken = false;

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function normalizeHeaderValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Twilio/proxies may send comma-separated values; take the first.
  return value.split(',')[0]?.trim() || undefined;
}

export function getTwilioRequestUrl(req: Request): string {
  const forwardedProto = normalizeHeaderValue(req.header('x-forwarded-proto'));
  const forwardedHost = normalizeHeaderValue(req.header('x-forwarded-host'));

  const proto = forwardedProto || req.protocol;
  const host = forwardedHost || req.get('host');

  // If host is somehow missing, fall back to req.hostname.
  const finalHost = host || req.hostname;

  return `${proto}://${finalHost}${req.originalUrl}`;
}

function flattenParams(params: Record<string, unknown>): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) continue;

    if (Array.isArray(rawValue)) {
      for (const v of rawValue) {
        if (v === undefined || v === null) continue;
        pairs.push([key, String(v)]);
      }
      continue;
    }

    if (typeof rawValue === 'object') {
      // Twilio form payloads are flat; ignore nested objects to avoid signature mismatches.
      pairs.push([key, String(rawValue)]);
      continue;
    }

    pairs.push([key, String(rawValue)]);
  }

  // Sort by key, then value for deterministic concatenation.
  pairs.sort(([aKey, aVal], [bKey, bVal]) => {
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });

  return pairs;
}

export function computeTwilioSignature(authToken: string, url: string, params: Record<string, unknown>): string {
  const pairs = flattenParams(params);
  const data = url + pairs.map(([k, v]) => `${k}${v}`).join('');

  return crypto.createHmac('sha1', authToken).update(data, 'utf8').digest('base64');
}

export function verifyTwilioSignature(req: Request, res: Response, next: NextFunction): void {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Only enforce signature if TWILIO_AUTH_TOKEN is configured.
  if (!authToken) {
    if (!config.isProduction) {
      if (!warnedMissingAuthToken) {
        warnedMissingAuthToken = true;
        console.warn('[Twilio] TWILIO_AUTH_TOKEN not set; skipping signature validation (development only)');
      }
      return next();
    }

    res.status(500).json({ success: false, error: 'Twilio webhook signature validation not configured' });
    return;
  }

  const signature = req.get('X-Twilio-Signature');
  if (!signature) {
    res.status(403).json({ success: false, error: 'Missing Twilio signature' });
    return;
  }

  const url = getTwilioRequestUrl(req);
  const params: Record<string, unknown> =
    req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};

  const expected = computeTwilioSignature(authToken, url, params);

  if (!timingSafeEqual(signature, expected)) {
    res.status(403).json({ success: false, error: 'Invalid Twilio signature' });
    return;
  }

  next();
}
