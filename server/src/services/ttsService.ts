/**
 * TTS Service Wrapper
 * HTTP client for TTS service (Parler-TTS)
 */

import axios from 'axios';
import { ttsProvider, TTSOptions } from '../core/providers/ttsProvider';
import { logger, redact } from '../utils/logger';

export interface TTSServiceOptions {
  serviceUrl?: string;
}

export class TTSService {
  private serviceUrl: string;

  constructor(options?: TTSServiceOptions) {
    this.serviceUrl = options?.serviceUrl || process.env.TTS_SERVICE_URL || 'http://tts-service:8000';
  }

  /**
   * Synthesize text to speech using TTS provider
   */
  async synthesize(text: string, voicePreset: string, options?: TTSOptions): Promise<Buffer> {
    try {
      return await ttsProvider.synthesize(text, voicePreset, options);
    } catch (error: any) {
      logger.error('tts_service.synthesize_failed', error, redact({
        textLength: text.length,
        voicePreset,
      }));
      throw error;
    }
  }

  /**
   * Synthesize and save to temporary file, return file path
   */
  async synthesizeToFile(text: string, voicePreset: string, options?: TTSOptions): Promise<string> {
    const audio = await this.synthesize(text, voicePreset, options);
    const fs = require('fs').promises;
    const path = require('path');
    const tmpDir = process.env.TMP_DIR || '/tmp';
    const filename = `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
    const filepath = path.join(tmpDir, filename);
    
    await fs.writeFile(filepath, audio);
    return filepath;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.serviceUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('tts_service.health_check_failed', error);
      return false;
    }
  }
}

export const ttsService = new TTSService();

