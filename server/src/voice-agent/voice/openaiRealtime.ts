import WebSocket from 'ws';
import { voiceAgentConfig } from '../config';

/**
 * OpenAI Realtime API Client
 * Handles WebSocket connection and event processing
 */

export interface RealtimeEvent {
  type: string;
  event: string;
  [key: string]: any;
}

export interface RealtimeCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAudio?: (audio: Buffer) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private callbacks: RealtimeCallbacks;
  private sessionId: string | null = null;

  constructor(callbacks: RealtimeCallbacks) {
    this.apiKey = voiceAgentConfig.asr.openaiRealtimeApiKey;
    this.callbacks = callbacks;
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
      
      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      this.ws.on('open', () => {
        this.callbacks.onOpen?.();
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const event = JSON.parse(data.toString());
          this.handleEvent(event);
        } catch (error) {
          this.callbacks.onError?.(new Error(`Failed to parse event: ${error}`));
        }
      });

      this.ws.on('error', (error) => {
        this.callbacks.onError?.(error);
        reject(error);
      });

      this.ws.on('close', () => {
        this.callbacks.onClose?.();
      });
    });
  }

  /**
   * Handle incoming events
   */
  private handleEvent(event: RealtimeEvent): void {
    switch (event.type) {
      case 'session.created':
        this.sessionId = event.session?.id || null;
        break;

      case 'response.audio_transcript.delta':
        if (event.delta) {
          this.callbacks.onTranscript?.(event.delta, false);
        }
        break;

      case 'response.audio_transcript.done':
        if (event.transcript) {
          this.callbacks.onTranscript?.(event.transcript, true);
        }
        break;

      case 'response.audio.delta':
        if (event.delta) {
          // Decode base64 audio
          const audioBuffer = Buffer.from(event.delta, 'base64');
          this.callbacks.onAudio?.(audioBuffer);
        }
        break;

      case 'error':
        this.callbacks.onError?.(new Error(event.error?.message || 'Unknown error'));
        break;
    }
  }

  /**
   * Send audio input
   */
  sendAudio(audio: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const base64Audio = audio.toString('base64');
    this.ws.send(
      JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      })
    );
  }

  /**
   * Send text input (for testing or text-only mode)
   */
  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text,
            },
          ],
        },
      })
    );
  }

  /**
   * Request response generation
   */
  requestResponse(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(
      JSON.stringify({
        type: 'response.create',
      })
    );
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}


