/**
 * ASR (Automatic Speech Recognition) Provider Interface
 * Supports multiple ASR backends with unified interface
 */

export interface ASRTranscriptionResult {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence?: number;
  }>;
  confidence?: number;
  language?: string;
}

export interface ASRProvider {
  /**
   * Transcribe audio to text
   * @param audio - Audio buffer (WAV format, 16kHz PCM recommended)
   * @param language - Language hint (e.g., 'de', 'en')
   * @returns Transcription result with text and optional segments
   */
  transcribe(audio: Buffer, language?: string): Promise<ASRTranscriptionResult>;
}

/**
 * Faster Whisper ASR Provider
 * Uses self-hosted faster-whisper service
 */
export class FasterWhisperProvider implements ASRProvider {
  private serviceUrl: string;

  constructor(serviceUrl?: string) {
    this.serviceUrl = serviceUrl || process.env.ASR_SERVICE_URL || 'http://asr-service:8000';
  }

  async transcribe(audio: Buffer, language?: string): Promise<ASRTranscriptionResult> {
    try {
      const axios = require('axios');
      // Convert Buffer to base64 string
      const audioBase64 = audio.toString('base64');

      const response = await axios.post(
        `${this.serviceUrl}/transcribe`,
        {
          audio: audioBase64,
          language: language || 'de',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30s timeout for transcription
        }
      );

      return {
        text: response.data.text || '',
        segments: response.data.segments,
        confidence: response.data.confidence,
        language: response.data.language || language,
      };
    } catch (error: any) {
      throw new Error(`FasterWhisper transcription failed: ${error.message}`);
    }
  }
}

/**
 * OpenAI Whisper ASR Provider (Fallback)
 * Uses OpenAI Whisper API as fallback
 */
export class OpenAIWhisperProvider implements ASRProvider {
  private apiKey: string;
  private client: any;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    if (this.apiKey) {
      const OpenAI = require('openai');
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  async transcribe(audio: Buffer, language?: string): Promise<ASRTranscriptionResult> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Use openai.toFile for better Node.js compatibility
      const { toFile } = require('openai');
      const file = await toFile(audio, 'audio.wav', { type: 'audio/wav' });
      
      const response = await this.client.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: language || 'de',
        response_format: 'verbose_json',
      });

      return {
        text: response.text || '',
        segments: response.segments?.map((s: any) => ({
          start: s.start,
          end: s.end,
          text: s.text,
        })),
        language: response.language || language,
      };
    } catch (error: any) {
      throw new Error(`OpenAI Whisper transcription failed: ${error.message}`);
    }
  }
}

/**
 * Get ASR provider based on configuration
 */
export function getASRProvider(): ASRProvider {
  const provider = (process.env.ASR_PROVIDER || 'faster_whisper') as 'faster_whisper' | 'openai_whisper';

  switch (provider) {
    case 'faster_whisper':
      return new FasterWhisperProvider();
    case 'openai_whisper':
      return new OpenAIWhisperProvider();
    default:
      return new FasterWhisperProvider();
  }
}

export const asrProvider = getASRProvider();

