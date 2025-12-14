/**
 * Audio Conversion Service
 * Handles conversion between Twilio mu-law (8kHz) and PCM16 (for ElevenLabs)
 */

/**
 * Mu-law to PCM16 conversion
 * Twilio typically sends mu-law encoded audio at 8kHz
 * Returns PCM16 (Int16Array) at 8kHz
 */
export function muLawToPCM16(muLawBuffer: Buffer): Int16Array {
  const pcm = new Int16Array(muLawBuffer.length);
  
  for (let i = 0; i < muLawBuffer.length; i++) {
    const muLawByte = muLawBuffer[i];
    
    // Mu-law decoding algorithm
    const sign = (muLawByte & 0x80) ? -1 : 1;
    const exponent = (muLawByte & 0x70) >> 4;
    const mantissa = (muLawByte & 0x0F) | 0x10;
    
    let sample = (mantissa << (exponent + 3)) - 0x84;
    sample = sign * sample;
    
    // Clamp to Int16 range
    pcm[i] = Math.max(-32768, Math.min(32767, sample));
  }
  
  return pcm;
}

/**
 * PCM16 to mu-law conversion
 * Converts PCM16 (Int16Array) to mu-law (8kHz)
 * Returns Buffer with mu-law encoded bytes
 */
export function pcm16ToMuLaw(pcm: Int16Array): Buffer {
  const muLawBuffer = Buffer.alloc(pcm.length);
  
  for (let i = 0; i < pcm.length; i++) {
    const sample = pcm[i];
    
    // Get sign bit
    const sign = sample < 0 ? 0x80 : 0x00;
    const absSample = Math.abs(sample);
    
    // Add bias
    const biased = absSample + 0x84;
    
    // Find exponent (log2 approximation)
    let exponent = 0;
    let temp = biased;
    while (temp > 0x1F) {
      temp >>= 1;
      exponent++;
    }
    
    // Clamp exponent
    if (exponent > 7) exponent = 7;
    
    // Extract mantissa
    const mantissa = (biased >> (exponent + 3)) & 0x0F;
    
    // Combine sign, exponent, mantissa
    muLawBuffer[i] = sign | (exponent << 4) | mantissa;
  }
  
  return muLawBuffer;
}

/**
 * Resample PCM16 from one sample rate to another
 * Simple linear interpolation (for small rate changes)
 * @param pcm Input PCM16 data
 * @param inputRate Input sample rate (e.g., 8000)
 * @param outputRate Output sample rate (e.g., 16000)
 */
export function resamplePCM16(pcm: Int16Array, inputRate: number, outputRate: number): Int16Array {
  if (inputRate === outputRate) {
    return pcm;
  }
  
  const ratio = outputRate / inputRate;
  const outputLength = Math.floor(pcm.length * ratio);
  const output = new Int16Array(outputLength);
  
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i / ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, pcm.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    
    // Linear interpolation
    output[i] = Math.round(
      pcm[srcIndexFloor] * (1 - fraction) + pcm[srcIndexCeil] * fraction
    );
  }
  
  return output;
}

/**
 * Convert Twilio mu-law base64 to PCM16 Buffer
 * @param base64MuLaw Base64 encoded mu-law audio
 * @param targetSampleRate Target sample rate (default: 16000 for ElevenLabs)
 */
export function convertTwilioAudioToPCM16(
  base64MuLaw: string,
  targetSampleRate: number = 16000
): Buffer {
  // Decode base64 to Buffer
  const muLawBuffer = Buffer.from(base64MuLaw, 'base64');
  
  // Convert mu-law to PCM16 (8kHz)
  const pcm8k = muLawToPCM16(muLawBuffer);
  
  // Resample to target rate if needed
  if (targetSampleRate !== 8000) {
    const pcmResampled = resamplePCM16(pcm8k, 8000, targetSampleRate);
    return Buffer.from(pcmResampled.buffer);
  }
  
  return Buffer.from(pcm8k.buffer);
}

/**
 * Convert PCM16 Buffer to Twilio mu-law base64
 * @param pcm16Buffer PCM16 audio buffer (typically 16kHz)
 * @param inputSampleRate Input sample rate (default: 16000)
 */
export function convertPCM16ToTwilioAudio(
  pcm16Buffer: Buffer,
  inputSampleRate: number = 16000
): string {
  // Convert Buffer to Int16Array
  const pcm16 = new Int16Array(
    pcm16Buffer.buffer,
    pcm16Buffer.byteOffset,
    pcm16Buffer.length / 2
  );
  
  // Resample to 8kHz if needed
  let pcm8k: Int16Array;
  if (inputSampleRate !== 8000) {
    pcm8k = resamplePCM16(pcm16, inputSampleRate, 8000);
  } else {
    pcm8k = pcm16;
  }
  
  // Convert PCM16 to mu-law
  const muLawBuffer = pcm16ToMuLaw(pcm8k);
  
  // Encode to base64
  return muLawBuffer.toString('base64');
}

/**
 * Self-check function for audio conversion
 * Tests mu-law round-trip conversion
 */
export function testAudioConversion(): boolean {
  try {
    // Create test PCM16 data (sine wave)
    const testLength = 160; // 20ms at 8kHz
    const pcm = new Int16Array(testLength);
    for (let i = 0; i < testLength; i++) {
      pcm[i] = Math.round(Math.sin((i / testLength) * Math.PI * 2) * 10000);
    }
    
    // Round-trip: PCM -> mu-law -> PCM
    const muLaw = pcm16ToMuLaw(pcm);
    const pcmRestored = muLawToPCM16(muLaw);
    
    // Check that we got similar data back (allowing for some loss in mu-law encoding)
    let maxDiff = 0;
    for (let i = 0; i < Math.min(pcm.length, pcmRestored.length); i++) {
      const diff = Math.abs(pcm[i] - pcmRestored[i]);
      if (diff > maxDiff) maxDiff = diff;
    }
    
    // Mu-law is lossy, so we expect some difference, but it should be reasonable
    const success = maxDiff < 5000; // Allow up to ~15% difference
    
    if (success) {
      console.log(`[AudioConversion] Self-check passed: maxDiff=${maxDiff}`);
    } else {
      console.warn(`[AudioConversion] Self-check warning: maxDiff=${maxDiff} (expected < 5000)`);
    }
    
    return success;
  } catch (error) {
    console.error('[AudioConversion] Self-check failed:', error);
    return false;
  }
}
