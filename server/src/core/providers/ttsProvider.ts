/**
 * TTS (Text-to-Speech) Provider Interface
 * Supports multiple TTS backends with unified interface
 */

import { elevenLabsService } from '../../services/elevenLabsService';

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
 * ElevenLabs TTS Provider
 * Uses ElevenLabs API for high-quality TTS
 */
export class ElevenLabsTTSProvider implements TTSProvider {
  // Map voice presets to ElevenLabs voice IDs
  private voicePresetMap: Record<string, string> = {
    'SwissProfessionalDE': '21m00Tcm4TlvDq8ikWAM', // Rachel - professional
    'FriendlyFemaleDE': 'EXAVITQu4vr4xnSDxMaL', // Sarah - friendly
    'NeutralDE': '21m00Tcm4TlvDq8ikWAM', // Rachel - neutral
  };

  async synthesize(text: string, voicePreset: string, options?: TTSOptions): Promise<Buffer> {
    try {
      // Map voice preset to ElevenLabs voice ID
      const voiceId = this.voicePresetMap[voicePreset] || '21m00Tcm4TlvDq8ikWAM';
      
      // Use multilingual model for German
      const modelId = options?.language === 'de' ? 'eleven_multilingual_v2' : 'eleven_turbo_v2_5';
      
      return await elevenLabsService.generateSpeech(text, voiceId, modelId);
    } catch (error: any) {
      throw new Error(`ElevenLabs TTS synthesis failed: ${error.message}`);
    }
  }
}

/**
 * Get TTS provider based on configuration
 * Priority:
 * 1. TTS_PROVIDER env var (if set)
 * 2. TTS_SERVICE_URL env var (if set, use Parler/Piper)
 * 3. ELEVENLABS_API_KEY (if set, use ElevenLabs)
 * 4. Default: ElevenLabs (if API key available) or Parler (fallback)
 */
export function getTTSProvider(): TTSProvider {
  const explicitProvider = process.env.TTS_PROVIDER;
  const ttsServiceUrl = process.env.TTS_SERVICE_URL;
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

  // If explicit provider is set, use it
  if (explicitProvider === 'elevenlabs') {
    return new ElevenLabsTTSProvider();
  }
  if (explicitProvider === 'parler') {
    return new ParlerTTSProvider();
  }
  if (explicitProvider === 'piper') {
    return new PiperTTSProvider();
  }

  // If TTS_SERVICE_URL is set, use Parler/Piper
  if (ttsServiceUrl) {
    return new ParlerTTSProvider();
  }

  // If ElevenLabs API key is available, use ElevenLabs (default for production)
  if (elevenLabsApiKey && elevenLabsApiKey !== '' && elevenLabsApiKey !== 'PLACEHOLDER_FOR_TESTING') {
    return new ElevenLabsTTSProvider();
  }

  // Fallback to Parler (will fail if service not available, but that's expected)
  return new ParlerTTSProvider();
}

export const ttsProvider = getTTSProvider();

