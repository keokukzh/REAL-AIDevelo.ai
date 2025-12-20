/**
 * ASR Service Wrapper
 * HTTP client for ASR service (faster-whisper)
 */

import axios from 'axios';
import { asrProvider, ASRTranscriptionResult } from '../core/providers/asrProvider';
import { logger, redact } from '../utils/logger';

export interface ASRServiceOptions {
  serviceUrl?: string;
}

export class ASRService {
  private serviceUrl: string;

  constructor(options?: ASRServiceOptions) {
    this.serviceUrl = options?.serviceUrl || process.env.ASR_SERVICE_URL || 'http://asr-service:8000';
  }

  /**
   * Transcribe audio using ASR provider
   */
  async transcribe(audio: Buffer, language?: string): Promise<ASRTranscriptionResult> {
    try {
      return await asrProvider.transcribe(audio, language);
    } catch (error: any) {
      logger.error('asr_service.transcribe_failed', error, redact({
        audioLength: audio.length,
        language,
      }));
      throw error;
    }
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
      logger.error('asr_service.health_check_failed', error);
      return false;
    }
  }
}

export const asrService = new ASRService();

