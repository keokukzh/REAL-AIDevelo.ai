import WebSocket from 'ws';
import { IncomingMessage } from 'http';

export interface TwilioMediaStreamSession {
  callSid: string;
  streamSid?: string;
  ws: WebSocket;
  startTime: Date;
  frameCount: number;
  byteCount: number;
  phoneNumber?: string; // To/From number for locationId resolution
  audioQueue: Buffer[]; // Queue for audio frames (backpressure protection)
  maxQueueSize: number; // Maximum queue size before dropping frames
  cleanupTimer?: NodeJS.Timeout; // Timer for automatic cleanup
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
    customParameters?: {
      to?: string;
      from?: string;
      callSid?: string;
    };
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
      audioQueue: [],
      maxQueueSize: 100, // Max 100 frames in queue (protect memory)
      cleanupTimer: undefined,
    };

    this.sessions.set(callSid, session);

    // Set cleanup timer (max 1 hour per call)
    session.cleanupTimer = setTimeout(() => {
      console.warn(`[TwilioMediaStream] Session timeout callSid=${callSid}, forcing cleanup`);
      this.cleanupSession(callSid, 'Timeout');
    }, 60 * 60 * 1000); // 1 hour

    // Handle WebSocket close
    ws.on('close', () => {
      console.log(`[TwilioMediaStream] Session closed callSid=${callSid} frames=${session.frameCount} bytes=${session.byteCount}`);
      this.cleanupSession(callSid, 'WebSocket closed');
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error(`[TwilioMediaStream] WebSocket error callSid=${callSid}:`, error);
      this.cleanupSession(callSid, `WebSocket error: ${error.message || 'Unknown'}`);
    });

    console.log(`[TwilioMediaStream] Session created callSid=${callSid}`);
    return session;
  }

  /**
   * Cleanup session (remove from map, clear timer, close bridge)
   */
  cleanupSession(callSid: string, reason: string): void {
    const session = this.sessions.get(callSid);
    if (!session) {
      return;
    }

    // Clear cleanup timer
    if (session.cleanupTimer) {
      clearTimeout(session.cleanupTimer);
      session.cleanupTimer = undefined;
    }

    // Clear audio queue
    session.audioQueue = [];

    // Close WebSocket if still open
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.close();
    }

    // Remove from sessions map
    this.sessions.delete(callSid);

    console.log(`[TwilioMediaStream] Session cleaned up callSid=${callSid} reason=${reason}`);
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
          // Store customParameters for locationId resolution fallback
          if (message.start.customParameters?.to) {
            session.phoneNumber = message.start.customParameters.to;
          }
          console.log(`[TwilioMediaStream] start streamSid=${session.streamSid} callSid=${session.callSid} tracks=${JSON.stringify(session.tracks)} customParameters=${JSON.stringify(message.start.customParameters)}`);
        }
        break;

      case 'media':
        if (message.media?.payload && message.media.track === 'inbound') {
          const audio = Buffer.from(message.media.payload, 'base64');
          session.frameCount += 1;
          session.byteCount += audio.length;

          // Backpressure: Drop frames if queue is too large
          if (session.audioQueue.length >= session.maxQueueSize) {
            // Drop oldest frame
            const dropped = session.audioQueue.shift();
            console.warn(`[TwilioMediaStream] Dropped frame callSid=${session.callSid} queueSize=${session.audioQueue.length} (backpressure)`);
          }

          // Add to queue (will be processed by bridge)
          session.audioQueue.push(audio);

          if (session.frameCount === 1 || session.frameCount % 50 === 0) {
            console.log(`[TwilioMediaStream] media callSid=${session.callSid} frames=${session.frameCount} bytes=${session.byteCount} queueSize=${session.audioQueue.length} track=${message.media.track || 'unknown'}`);
          }
          // Forward to ElevenLabs bridge (only inbound audio)
          // Bridge will be created on 'start' event
        }
        break;

      case 'stop':
        if (message.stop) {
          console.log(`[TwilioMediaStream] stop streamSid=${message.stop.streamSid || session.streamSid} callSid=${session.callSid} frames=${session.frameCount} bytes=${session.byteCount}`);
          this.cleanupSession(session.callSid, 'Twilio stop event');
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
    for (const [callSid] of this.sessions.entries()) {
      this.cleanupSession(callSid, 'Service shutdown');
    }
    console.log('[TwilioMediaStream] All sessions cleaned up');
  }
}

export const twilioMediaStreamService = new TwilioMediaStreamService();
