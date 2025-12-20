/**
 * Telephony Adapter Interface
 * Abstracts telephony backend (FreeSWITCH, Twilio, etc.)
 */

export interface CallOptions {
  locationId?: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

export interface CallSession {
  sessionId: string;
  callSid: string; // FreeSWITCH UUID or Twilio CallSid
  direction: 'inbound' | 'outbound' | 'test';
  from?: string;
  to?: string;
  status: 'initiating' | 'ringing' | 'active' | 'completed' | 'failed';
  startedAt: Date;
  endedAt?: Date;
}

export interface TelephonyAdapter {
  /**
   * Initiate a call
   * @param to - Destination number/extension
   * @param from - Source number/extension
   * @param options - Call options (locationId, agentId, metadata)
   * @returns Call session
   */
  initiateCall(to: string, from: string, options?: CallOptions): Promise<CallSession>;

  /**
   * Play audio file to active call
   * @param sessionId - Call session ID
   * @param audioUrl - URL or path to audio file
   * @returns Promise that resolves when playback starts
   */
  playAudio(sessionId: string, audioUrl: string): Promise<void>;

  /**
   * Record utterance from active call
   * @param sessionId - Call session ID
   * @param maxDuration - Maximum recording duration in seconds
   * @returns Audio buffer (WAV format)
   */
  recordUtterance(sessionId: string, maxDuration: number): Promise<Buffer>;

  /**
   * Hangup call
   * @param sessionId - Call session ID
   */
  hangup(sessionId: string): Promise<void>;

  /**
   * Get call status
   * @param sessionId - Call session ID
   * @returns Current call status
   */
  getCallStatus(sessionId: string): Promise<CallSession | null>;
}

/**
 * FreeSWITCH Telephony Adapter
 * Uses ESL (Event Socket Library) to control FreeSWITCH
 */
export class FreeSWITCHAdapter implements TelephonyAdapter {
  private eslHost: string;
  private eslPort: number;
  private eslPassword: string;
  private sessions: Map<string, CallSession> = new Map();

  constructor() {
    this.eslHost = process.env.FREESWITCH_ESL_HOST || 'freeswitch';
    this.eslPort = parseInt(process.env.FREESWITCH_ESL_PORT || '8021', 10);
    this.eslPassword = process.env.FREESWITCH_ESL_PASSWORD || 'ClueCon';
  }

  async initiateCall(to: string, from: string, options?: CallOptions): Promise<CallSession> {
    try {
      // For now, use HTTP API (mod_xml_curl or mod_http) instead of ESL
      // ESL integration can be added later for more control
      const axios = require('axios');
      const callSid = this.generateCallSid();

      const session: CallSession = {
        sessionId: callSid,
        callSid,
        direction: options?.metadata?.direction as any || 'outbound',
        from,
        to,
        status: 'initiating',
        startedAt: new Date(),
      };

      this.sessions.set(callSid, session);

      // Initiate call via FreeSWITCH HTTP API or ESL
      // This is a placeholder - actual implementation depends on FreeSWITCH setup
      // For WebRTC test calls, the frontend will handle connection
      // For outbound calls, we'd use ESL: originate user/${to} <action>...

      session.status = 'ringing';
      return session;
    } catch (error: any) {
      throw new Error(`FreeSWITCH call initiation failed: ${error.message}`);
    }
  }

  async playAudio(sessionId: string, audioUrl: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Use ESL or HTTP API to play audio
      // ESL command: uuid_broadcast <uuid> <path> aleg
      // This is a placeholder - actual implementation requires ESL connection
      const axios = require('axios');
      
      // For now, assume audioUrl is accessible via HTTP
      // FreeSWITCH can play from HTTP URLs directly
      await axios.post(`http://${this.eslHost}:${this.eslPort}/api/playback`, {
        uuid: session.callSid,
        path: audioUrl,
      });

      // Alternative: Use ESL directly (requires freeswitch-esl package)
      // const esl = require('freeswitch-esl');
      // const client = esl.client(this.eslHost, this.eslPort, this.eslPassword);
      // await client.send(`bgapi uuid_broadcast ${session.callSid} ${audioUrl} aleg`);
    } catch (error: any) {
      throw new Error(`FreeSWITCH playAudio failed: ${error.message}`);
    }
  }

  async recordUtterance(sessionId: string, maxDuration: number): Promise<Buffer> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Use ESL to record call
      // ESL command: uuid_record <uuid> start <path> <max_sec>
      // This is a placeholder - actual implementation requires ESL connection
      const axios = require('axios');
      const recordPath = `/tmp/record_${session.callSid}.wav`;

      // Start recording
      await axios.post(`http://${this.eslHost}:${this.eslPort}/api/record`, {
        uuid: session.callSid,
        path: recordPath,
        max_duration: maxDuration,
      });

      // Wait for recording to complete (or timeout)
      // In production, this would use events or polling
      await new Promise(resolve => setTimeout(resolve, maxDuration * 1000 + 1000));

      // Read recorded file
      const fs = require('fs').promises;
      const audio = await fs.readFile(recordPath);

      // Cleanup
      await fs.unlink(recordPath).catch(() => {});

      return audio;
    } catch (error: any) {
      throw new Error(`FreeSWITCH recordUtterance failed: ${error.message}`);
    }
  }

  async hangup(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Use ESL to hangup call
      // ESL command: uuid_kill <uuid>
      const axios = require('axios');
      
      await axios.post(`http://${this.eslHost}:${this.eslPort}/api/hangup`, {
        uuid: session.callSid,
      });

      session.status = 'completed';
      session.endedAt = new Date();
    } catch (error: any) {
      throw new Error(`FreeSWITCH hangup failed: ${error.message}`);
    }
  }

  async getCallStatus(sessionId: string): Promise<CallSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  private generateCallSid(): string {
    const { randomUUID } = require('crypto');
    return randomUUID();
  }
}

/**
 * Twilio Telephony Adapter (Optional Fallback)
 * Uses Twilio API for production calls
 */
export class TwilioAdapter implements TelephonyAdapter {
  private accountSid: string;
  private authToken: string;
  private sessions: Map<string, CallSession> = new Map();

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
  }

  async initiateCall(to: string, from: string, options?: CallOptions): Promise<CallSession> {
    try {
      const axios = require('axios');
      const twilio = require('twilio');

      const client = twilio(this.accountSid, this.authToken);

      const call = await client.calls.create({
        to,
        from,
        url: `${process.env.PUBLIC_BASE_URL}/api/twilio/voice/inbound`, // TwiML URL
      });

      const session: CallSession = {
        sessionId: call.sid,
        callSid: call.sid,
        direction: 'outbound',
        from,
        to,
        status: 'ringing',
        startedAt: new Date(),
      };

      this.sessions.set(call.sid, session);
      return session;
    } catch (error: any) {
      throw new Error(`Twilio call initiation failed: ${error.message}`);
    }
  }

  async playAudio(sessionId: string, audioUrl: string): Promise<void> {
    // Twilio uses TwiML for audio playback
    // This would be handled via TwiML <Play> verb
    // For now, this is a placeholder
    throw new Error('Twilio playAudio not implemented - use TwiML instead');
  }

  async recordUtterance(sessionId: string, maxDuration: number): Promise<Buffer> {
    // Twilio recording would be handled via TwiML <Record> verb
    // Recording URL would be provided via webhook
    throw new Error('Twilio recordUtterance not implemented - use TwiML <Record> instead');
  }

  async hangup(sessionId: string): Promise<void> {
    try {
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);
      await client.calls(sessionId).update({ status: 'completed' });

      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = 'completed';
        session.endedAt = new Date();
      }
    } catch (error: any) {
      throw new Error(`Twilio hangup failed: ${error.message}`);
    }
  }

  async getCallStatus(sessionId: string): Promise<CallSession | null> {
    return this.sessions.get(sessionId) || null;
  }
}

/**
 * Get telephony adapter based on configuration
 */
export function getTelephonyAdapter(): TelephonyAdapter {
  const adapter = (process.env.TELEPHONY_ADAPTER || 'freeswitch') as 'freeswitch' | 'twilio';

  switch (adapter) {
    case 'freeswitch':
      return new FreeSWITCHAdapter();
    case 'twilio':
      return new TwilioAdapter();
    default:
      return new FreeSWITCHAdapter();
  }
}

export const telephonyAdapter = getTelephonyAdapter();

