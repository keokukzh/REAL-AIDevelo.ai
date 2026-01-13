/**
 * TTS (Text-to-Speech) Provider Interface
 * Supports multiple TTS backends with unified interface
 */

import { AzureTTS } from '../../services/AzureTTS';

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
 * Azure TTS Provider
 * Uses Azure Cognitive Services for high-quality TTS
 */
export class AzureTTSProvider implements TTSProvider {
  private azureTTS: AzureTTS;

  constructor() {
    this.azureTTS = new AzureTTS();
  }

  async synthesize(text: string, _voicePreset: string, _options?: TTSOptions): Promise<Buffer> {
    try {
      return await this.azureTTS.synthesize(text);
    } catch (error: any) {
      throw new Error(`Azure TTS synthesis failed: ${error.message}`);
    }
  }
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
        },
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

  private async getCachedAudio(_cacheKey: string): Promise<Buffer | null> {
    try {
      // Placeholder for cache implementation
      return null;
    } catch {
      return null;
    }
  }

  private async cacheAudio(_cacheKey: string, _audio: Buffer): Promise<void> {
    try {
      // Placeholder
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
        },
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Piper TTS synthesis failed: ${error.message}`);
    }
  }
}

/**
 * OpenAI TTS Provider
 * Uses OpenAI Audio API for TTS
 */
export class OpenAITTSProvider implements TTSProvider {
  private apiKey: string;
  private client: any;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    if (this.apiKey) {
      const OpenAI = require('openai');
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  async synthesize(text: string, _voicePreset: string, _options?: TTSOptions): Promise<Buffer> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const voice = process.env.OPENAI_TTS_VOICE || 'alloy';
      const response = await this.client.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error: any) {
      throw new Error(`OpenAI TTS synthesis failed: ${error.message}`);
    }
  }
}

/**
 * Get TTS provider based on configuration
 * Priority:
 * 1. TTS_PROVIDER env var (if set: azure, parler, piper, openai)
 * 2. AZURE_SPEECH_KEY (if set, use Azure)
 * 3. OPENAI_API_KEY (if set, use OpenAI)
 * 4. Default: Azure (fallback)
 */
export function getTTSProvider(): TTSProvider {
  const explicitProvider = process.env.TTS_PROVIDER;
  const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // If explicit provider is set, use it
  if (explicitProvider === 'azure') {
    return new AzureTTSProvider();
  }
  if (explicitProvider === 'openai') {
    return new OpenAITTSProvider();
  }
  if (explicitProvider === 'parler') {
    return new ParlerTTSProvider();
  }
  if (explicitProvider === 'piper') {
    return new PiperTTSProvider();
  }

  // If Azure Speech Key is available, use Azure
  if (azureSpeechKey && azureSpeechKey !== '') {
    return new AzureTTSProvider();
  }

  // If OpenAI API key is available, use OpenAI
  if (openaiApiKey && openaiApiKey !== '' && !openaiApiKey.includes('placeholder')) {
    return new OpenAITTSProvider();
  }

  // Fallback to Azure
  return new AzureTTSProvider();
}

export const ttsProvider = getTTSProvider();
