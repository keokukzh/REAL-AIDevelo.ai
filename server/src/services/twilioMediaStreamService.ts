import WebSocket from 'ws';
import { IncomingMessage } from 'http';

export interface TwilioMediaStreamSession {
  callSid: string;
  streamSid?: string;
  ws: WebSocket;
  startTime: Date;
  frameCount: number;
  byteCount: number;
  tracks?: {
    inbound?: { codec?: string; sampleRate?: number };
    outbound?: { codec?: string; sampleRate?: number };
  };
}

export interface TwilioStreamMessage {
  event: 'start' | 'media' | 'stop' | 'mark';
  start?: {
    streamSid: string;
    callSid: string;
    accountSid?: string;
    tracks?: {
      inbound?: { codec?: string; sampleRate?: number };
      outbound?: { codec?: string; sampleRate?: number };
    };
  };
  media?: {
    payload: string; // base64 encoded audio
    track?: 'inbound' | 'outbound';
    timestamp?: string;
  };
  stop?: {
    streamSid: string;
    callSid?: string;
  };
  mark?: {
    name?: string;
    timestamp?: string;
  };
}

/**
 * Twilio Media Stream Service
 * Manages WebSocket connections and sessions for Twilio Media Streams
 */
export class TwilioMediaStreamService {
  private sessions: Map<string, TwilioMediaStreamSession> = new Map();

  /**
   * Create a new session from WebSocket connection
   */
  createSession(callSid: string, ws: WebSocket): TwilioMediaStreamSession {
    const session: TwilioMediaStreamSession = {
      callSid,
      ws,
      startTime: new Date(),
      frameCount: 0,
      byteCount: 0,
    };

    this.sessions.set(callSid, session);

    // Handle WebSocket close
    ws.on('close', () => {
      console.log(`[TwilioMediaStream] Session closed callSid=${callSid} frames=${session.frameCount} bytes=${session.byteCount}`);
      this.sessions.delete(callSid);
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error(`[TwilioMediaStream] WebSocket error callSid=${callSid}:`, error);
    });

    console.log(`[TwilioMediaStream] Session created callSid=${callSid}`);
    return session;
  }

  /**
   * Get session by callSid
   */
  getSession(callSid: string): TwilioMediaStreamSession | undefined {
    return this.sessions.get(callSid);
  }

  /**
   * Handle Twilio stream message
   */
  handleMessage(session: TwilioMediaStreamSession, message: TwilioStreamMessage): void {
    const { event } = message;

    switch (event) {
      case 'start':
        if (message.start) {
          session.streamSid = message.start.streamSid;
          session.tracks = message.start.tracks;
          console.log(`[TwilioMediaStream] start streamSid=${session.streamSid} callSid=${session.callSid} tracks=${JSON.stringify(session.tracks)}`);
        }
        break;

      case 'media':
        if (message.media?.payload) {
          const audio = Buffer.from(message.media.payload, 'base64');
          session.frameCount += 1;
          session.byteCount += audio.length;
          if (session.frameCount === 1 || session.frameCount % 50 === 0) {
            console.log(`[TwilioMediaStream] media callSid=${session.callSid} frames=${session.frameCount} bytes=${session.byteCount} track=${message.media.track || 'unknown'}`);
          }
          // TODO: Forward to ElevenLabs bridge (Step 4)
        }
        break;

      case 'stop':
        if (message.stop) {
          console.log(`[TwilioMediaStream] stop streamSid=${message.stop.streamSid || session.streamSid} callSid=${session.callSid} frames=${session.frameCount} bytes=${session.byteCount}`);
          session.ws.close();
          this.sessions.delete(session.callSid);
        }
        break;

      case 'mark':
        if (message.mark) {
          console.log(`[TwilioMediaStream] mark callSid=${session.callSid} name=${message.mark.name || 'unknown'}`);
        }
        break;

      default:
        console.log(`[TwilioMediaStream] unknown event=${String(event)} callSid=${session.callSid}`);
    }
  }

  /**
   * Send media to Twilio (for outbound audio)
   */
  sendMedia(session: TwilioMediaStreamSession, audioBuffer: Buffer, track: 'inbound' | 'outbound' = 'outbound'): void {
    if (session.ws.readyState === WebSocket.OPEN && session.streamSid) {
      const payload = audioBuffer.toString('base64');
      const message = {
        event: 'media' as const,
        streamSid: session.streamSid,
        media: {
          payload,
          track,
        },
      };
      session.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Cleanup all sessions (for graceful shutdown)
   */
  cleanup(): void {
    for (const [callSid, session] of this.sessions.entries()) {
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.close();
      }
      this.sessions.delete(callSid);
    }
    console.log('[TwilioMediaStream] All sessions cleaned up');
  }
}

export const twilioMediaStreamService = new TwilioMediaStreamService();
