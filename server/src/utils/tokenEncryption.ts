import crypto from 'crypto';

/**
 * Token Encryption Utility
 * Uses AES-256-GCM for encrypting refresh tokens
 * 
 * Format: JSON {iv, tag, data} base64 encoded
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * Accepts base64, hex, or utf8 string
 * Must result in exactly 32 bytes
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.TOKEN_ENCRYPTION_KEY;
  
  if (!keyEnv) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
  }

  let keyBuffer: Buffer;

  // Try base64 first (most common)
  try {
    keyBuffer = Buffer.from(keyEnv, 'base64');
    if (keyBuffer.length === KEY_LENGTH) {
      return keyBuffer;
    }
  } catch {
    // Not base64, continue
  }

  // Try hex
  try {
    keyBuffer = Buffer.from(keyEnv, 'hex');
    if (keyBuffer.length === KEY_LENGTH) {
      return keyBuffer;
    }
  } catch {
    // Not hex, continue
  }

  // Try utf8 (will be hashed to 32 bytes)
  try {
    const utf8Buffer = Buffer.from(keyEnv, 'utf8');
    // Hash to exactly 32 bytes using SHA-256
    keyBuffer = crypto.createHash('sha256').update(utf8Buffer).digest();
    if (keyBuffer.length === KEY_LENGTH) {
      return keyBuffer;
    }
  } catch {
    // Should not happen
  }

  throw new Error(
    `TOKEN_ENCRYPTION_KEY must be 32 bytes. Got ${keyEnv.length} chars. ` +
    `Provide base64 (44 chars), hex (64 chars), or utf8 (will be hashed to 32 bytes)`
  );
}

/**
 * Encrypt plaintext string
 * Returns base64-encoded JSON: {iv, tag, data}
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const tag = cipher.getAuthTag();
  
  const payload = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decrypt encrypted payload
 * Expects base64-encoded JSON: {iv, tag, data}
 */
export function decrypt(encryptedPayload: string): string {
  if (!encryptedPayload) {
    throw new Error('Cannot decrypt empty string');
  }

  const key = getEncryptionKey();
  
  let payload: { iv: string; tag: string; data: string };
  try {
    const decoded = Buffer.from(encryptedPayload, 'base64').toString('utf8');
    payload = JSON.parse(decoded);
  } catch (error) {
    throw new Error(`Invalid encrypted payload format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (!payload.iv || !payload.tag || !payload.data) {
    throw new Error('Invalid payload structure: missing iv, tag, or data');
  }

  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const encrypted = Buffer.from(payload.data, 'base64');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }

  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Invalid tag length: expected ${TAG_LENGTH}, got ${tag.length}`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}
