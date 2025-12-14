import crypto from 'crypto';

/**
 * OAuth State Signing Utility
 * Creates HMAC-signed state tokens with TTL (10 minutes)
 * 
 * Format: base64({payload: {ts, nonce, locationId, provider}, signature})
 */

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const ALGORITHM = 'sha256';

/**
 * Get signing secret from environment
 * Falls back to TOKEN_ENCRYPTION_KEY if OAUTH_STATE_SECRET not set
 */
function getSigningSecret(): Buffer {
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;

  if (stateSecret) {
    // Try base64, hex, or utf8 (hash to 32 bytes)
    try {
      const buf = Buffer.from(stateSecret, 'base64');
      if (buf.length >= 32) {
        return buf.slice(0, 32);
      }
    } catch {}
    
    try {
      const buf = Buffer.from(stateSecret, 'hex');
      if (buf.length >= 32) {
        return buf.slice(0, 32);
      }
    } catch {}
    
    // Hash utf8 to 32 bytes
    return crypto.createHash('sha256').update(stateSecret, 'utf8').digest();
  }

  if (encryptionKey) {
    // Fallback to TOKEN_ENCRYPTION_KEY (hash to 32 bytes)
    return crypto.createHash('sha256').update(encryptionKey, 'utf8').digest();
  }

  throw new Error('OAUTH_STATE_SECRET or TOKEN_ENCRYPTION_KEY must be set');
}

interface StatePayload {
  ts: number; // timestamp
  nonce: string; // random string
  locationId: string;
  provider: 'google' | 'outlook';
}

/**
 * Create signed OAuth state
 * Returns base64-encoded JSON with payload and HMAC signature
 */
export function createSignedState(params: {
  locationId: string;
  provider: 'google' | 'outlook';
}): string {
  const { locationId, provider } = params;

  if (!locationId) {
    throw new Error('locationId is required');
  }

  const payload: StatePayload = {
    ts: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
    locationId,
    provider,
  };

  const payloadJson = JSON.stringify(payload);
  const secret = getSigningSecret();
  const signature = crypto.createHmac(ALGORITHM, secret).update(payloadJson).digest('hex');

  const signedState = {
    payload,
    signature,
  };

  return Buffer.from(JSON.stringify(signedState)).toString('base64');
}

/**
 * Verify signed OAuth state
 * Returns decoded payload if valid, throws if invalid/expired
 */
export function verifySignedState(state: string): { locationId: string; provider: 'google' | 'outlook' } {
  if (!state) {
    throw new Error('State is required');
  }

  let signedState: { payload: StatePayload; signature: string };
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf8');
    signedState = JSON.parse(decoded);
  } catch (error) {
    throw new Error(`Invalid state format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (!signedState.payload || !signedState.signature) {
    throw new Error('Invalid state structure: missing payload or signature');
  }

  const { payload, signature } = signedState;

  // Verify signature
  const secret = getSigningSecret();
  const payloadJson = JSON.stringify(payload);
  const expectedSignature = crypto.createHmac(ALGORITHM, secret).update(payloadJson).digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('Invalid state signature');
  }

  // Check TTL
  const age = Date.now() - payload.ts;
  if (age > TTL_MS) {
    throw new Error(`State expired: ${Math.round(age / 1000)}s old (max ${TTL_MS / 1000}s)`);
  }

  // Check if state is from the future (shouldn't happen, but validate)
  if (age < -60000) {
    throw new Error(`State from future: ${Math.round(age / 1000)}s`);
  }

  // Validate required fields
  if (!payload.locationId || !payload.provider) {
    throw new Error('Invalid payload: missing locationId or provider');
  }

  if (payload.provider !== 'google' && payload.provider !== 'outlook') {
    throw new Error(`Invalid provider: ${payload.provider}`);
  }

  return {
    locationId: payload.locationId,
    provider: payload.provider,
  };
}
