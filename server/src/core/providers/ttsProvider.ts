/**
 * TTS (Text-to-Speech) Provider Interface
 * Supports multiple TTS backends with unified interface
 */

export interface TTSOptions {
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface TTSProvider {
  /**
   * Synthesize text to speech audio
   * @param text - Text to synthesize
   * @param voicePreset - Voice preset identifier (e.g., 'SwissProfessionalDE')
   * @param options - Optional TTS parameters (speed, pitch, etc.)
   * @returns Audio buffer (WAV format, 16kHz PCM)
   */
  synthesize(text: string, voicePreset: string, options?: TTSOptions): Promise<Buffer>;
}

/**
 * Parler TTS Provider
 * Uses self-hosted Parler-TTS service
 */
export class ParlerTTSProvider implements TTSProvider {
  private serviceUrl: string;
  private cacheEnabled: boolean;

  constructor(serviceUrl?: string, cacheEnabled: boolean = true) {
    this.serviceUrl = serviceUrl || process.env.TTS_SERVICE_URL || 'http://tts-service:8000';
    this.cacheEnabled = cacheEnabled;
  }

  async synthesize(text: string, voicePreset: string, options?: TTSOptions): Promise<Buffer> {
    try {
      // Check cache first (if enabled)
      if (this.cacheEnabled) {
        const cacheKey = this.getCacheKey(text, voicePreset, options);
        const cached = await this.getCachedAudio(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const axios = require('axios');

      const response = await axios.post(
        `${this.serviceUrl}/synthesize`,
        {
          text,
          voice_preset: voicePreset,
          language: options?.language || 'de',
          speed: options?.speed || 1.0,
          pitch: options?.pitch || 1.0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 30000, // 30s timeout for synthesis
        }
      );

      const audioBuffer = Buffer.from(response.data);

      // Cache the result (if enabled)
      if (this.cacheEnabled) {
        const cacheKey = this.getCacheKey(text, voicePreset, options);
        await this.cacheAudio(cacheKey, audioBuffer);
      }

      return audioBuffer;
    } catch (error: any) {
      throw new Error(`Parler TTS synthesis failed: ${error.message}`);
    }
  }

  private getCacheKey(text: string, voicePreset: string, options?: TTSOptions): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(text);
    hash.update(voicePreset);
    if (options) {
      hash.update(JSON.stringify(options));
    }
    return hash.digest('hex');
  }

  private async getCachedAudio(cacheKey: string): Promise<Buffer | null> {
    try {
      // Try MinIO cache first
      const minioEndpoint = process.env.MINIO_ENDPOINT || 'minio:9000';
      const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
      const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
      const minioBucket = process.env.MINIO_BUCKET || 'tts-cache';

      // For now, return null (MinIO integration can be added later)
      // This is a placeholder for cache implementation
      return null;
    } catch {
      return null;
    }
  }

  private async cacheAudio(cacheKey: string, audio: Buffer): Promise<void> {
    try {
      // Store in MinIO cache (implementation can be added later)
      // For now, this is a no-op
    } catch {
      // Cache failures should not break synthesis
    }
  }
}

/**
 * Piper TTS Provider (Optional Fallback)
 * Uses self-hosted Piper TTS service (CPU-only, faster)
 */
export class PiperTTSProvider implements TTSProvider {
  private serviceUrl: string;

  constructor(serviceUrl?: string) {
    this.serviceUrl = serviceUrl || process.env.TTS_SERVICE_URL || 'http://tts-service:8000';
  }

  async synthesize(text: string, voicePreset: string, options?: TTSOptions): Promise<Buffer> {
    try {
      const axios = require('axios');

      const response = await axios.post(
        `${this.serviceUrl}/synthesize`,
        {
          text,
          voice_preset: voicePreset,
          language: options?.language || 'de',
          speed: options?.speed || 1.0,
          engine: 'piper', // Specify Piper engine
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 20000, // 20s timeout (Piper is faster)
        }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Piper TTS synthesis failed: ${error.message}`);
    }
  }
}

/**
 * Get TTS provider based on configuration
 */
export function getTTSProvider(): TTSProvider {
  const provider = (process.env.TTS_PROVIDER || 'parler') as 'parler' | 'piper';

  switch (provider) {
    case 'parler':
      return new ParlerTTSProvider();
    case 'piper':
      return new PiperTTSProvider();
    default:
      return new ParlerTTSProvider();
  }
}

export const ttsProvider = getTTSProvider();

