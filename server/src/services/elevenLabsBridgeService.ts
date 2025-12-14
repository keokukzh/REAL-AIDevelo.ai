import WebSocket from 'ws';
import { ElevenLabsStreamingClient, ConversationConfig, ElevenLabsStreamCallbacks } from '../voice-agent/voice/elevenLabsStreaming';
import { twilioMediaStreamService, TwilioMediaStreamSession } from './twilioMediaStreamService';
import { convertTwilioAudioToPCM16, convertPCM16ToTwilioAudio } from './audioConversionService';
import { supabaseAdmin } from './supabaseDb';
import { ensureAgentConfig } from './supabaseDb';
import { voiceAgentConfig } from '../voice-agent/config';

export interface BridgeSession {
  callSid: string;
  locationId: string;
  elevenAgentId: string;
  twilioSession: TwilioMediaStreamSession;
  elevenLabsClient: ElevenLabsStreamingClient | null;
  reconnectAttempts: number;
  bytesIn: number;
  bytesOut: number;
  startTime: Date;
}

/**
 * ElevenLabs Bridge Service
 * Bridges Twilio Media Streams to ElevenLabs Conversational API
 */
export class ElevenLabsBridgeService {
  private bridges: Map<string, BridgeSession> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  /**
   * Resolve locationId from callSid
   * Tries multiple methods:
   * 1. From call_logs (if call was already logged)
   * 2. From phone_numbers via To/From number (requires phoneNumber parameter)
   */
  private async resolveLocationIdFromCallSid(callSid: string, phoneNumber?: string): Promise<string | null> {
    try {
      // Method 1: Try to get from call_logs first
      const { data: callLog } = await supabaseAdmin
        .from('call_logs')
        .select('location_id')
        .eq('call_sid', callSid)
        .maybeSingle();

      if (callLog?.location_id) {
        return callLog.location_id;
      }

      // Method 2: Try to get from phone_numbers if phoneNumber provided
      if (phoneNumber) {
        const { data: phoneData } = await supabaseAdmin
          .from('phone_numbers')
          .select('location_id')
          .or(`e164.eq.${phoneNumber},customer_public_number.eq.${phoneNumber}`)
          .limit(1)
          .maybeSingle();

        if (phoneData?.location_id) {
          return phoneData.location_id;
        }
      }

      return null;
    } catch (error) {
      console.error(`[ElevenLabsBridge] Error resolving locationId for callSid=${callSid}:`, error);
      return null;
    }
  }

  /**
   * Get ElevenLabs agent ID from locationId
   */
  private async getElevenLabsAgentId(locationId: string): Promise<string | null> {
    try {
      const agentConfig = await ensureAgentConfig(locationId);
      return agentConfig.eleven_agent_id;
    } catch (error) {
      console.error(`[ElevenLabsBridge] Error getting agent config for locationId=${locationId}:`, error);
      return null;
    }
  }

  /**
   * Create bridge session
   */
  async createBridge(callSid: string, twilioSession: TwilioMediaStreamSession, phoneNumber?: string): Promise<void> {
    // Resolve locationId
    const locationId = await this.resolveLocationIdFromCallSid(callSid, phoneNumber);
    if (!locationId) {
      console.error(`[ElevenLabsBridge] Could not resolve locationId for callSid=${callSid}, bridge not created`);
      return;
    }

    // Get ElevenLabs agent ID
    const elevenAgentId = await this.getElevenLabsAgentId(locationId);
    if (!elevenAgentId) {
      console.error(`[ElevenLabsBridge] No ElevenLabs agent ID for locationId=${locationId}, bridge not created`);
      return;
    }

    console.log(`[ElevenLabsBridge] Creating bridge callSid=${callSid} locationId=${locationId} agentId=${elevenAgentId}`);

    const bridge: BridgeSession = {
      callSid,
      locationId,
      elevenAgentId,
      twilioSession,
      elevenLabsClient: null,
      reconnectAttempts: 0,
      bytesIn: 0,
      bytesOut: 0,
      startTime: new Date(),
    };

    this.bridges.set(callSid, bridge);

    // Connect to ElevenLabs
    await this.connectToElevenLabs(bridge);
  }

  /**
   * Connect to ElevenLabs Conversational API
   */
  private async connectToElevenLabs(bridge: BridgeSession): Promise<void> {
    try {
      const config: ConversationConfig = {
        agentId: bridge.elevenAgentId,
        customerId: bridge.locationId, // Use locationId as customerId
        language: 'de',
      };

      const callbacks: ElevenLabsStreamCallbacks = {
        onAudioChunk: (audio: Buffer) => {
          // Convert PCM16 to Twilio mu-law and send back
          try {
            const muLawBase64 = convertPCM16ToTwilioAudio(audio, 16000); // ElevenLabs sends 16kHz PCM
            twilioMediaStreamService.sendMedia(bridge.twilioSession, Buffer.from(muLawBase64, 'base64'), 'outbound');
            bridge.bytesOut += audio.length;
          } catch (error: any) {
            console.error(`[ElevenLabsBridge] Error converting/sending audio outbound:`, error.message);
          }
        },
        onTranscription: (text: string, isFinal: boolean) => {
          console.log(`[ElevenLabsBridge] Transcription callSid=${bridge.callSid} text="${text}" isFinal=${isFinal}`);
          // TODO: Store transcript in call_logs (Step 5)
        },
        onError: (error: Error) => {
          console.error(`[ElevenLabsBridge] ElevenLabs error callSid=${bridge.callSid}:`, error.message);
          this.handleElevenLabsError(bridge, error);
        },
        onClose: () => {
          console.log(`[ElevenLabsBridge] ElevenLabs disconnected callSid=${bridge.callSid}`);
          this.handleElevenLabsDisconnect(bridge);
        },
        onOpen: () => {
          console.log(`[ElevenLabsBridge] ElevenLabs connected callSid=${bridge.callSid}`);
        },
      };

      const client = new ElevenLabsStreamingClient(config, callbacks);
      await client.connect();
      bridge.elevenLabsClient = client;
      bridge.reconnectAttempts = 0;

      console.log(`[ElevenLabsBridge] Connected callSid=${bridge.callSid} agentId=${bridge.elevenAgentId}`);
    } catch (error: any) {
      console.error(`[ElevenLabsBridge] Failed to connect to ElevenLabs callSid=${bridge.callSid}:`, error.message);
      this.handleElevenLabsError(bridge, error);
    }
  }

  /**
   * Handle ElevenLabs audio input (from Twilio) - public method using callSid
   */
  handleTwilioAudioByCallSid(callSid: string, base64MuLaw: string): void {
    const bridge = this.bridges.get(callSid);
    if (!bridge) {
      return; // Bridge not created yet or already closed
    }
    this.handleTwilioAudio(bridge, base64MuLaw);
  }

  /**
   * Handle ElevenLabs audio input (from Twilio) - internal method
   */
  private handleTwilioAudio(bridge: BridgeSession, base64MuLaw: string): void {
    if (!bridge.elevenLabsClient || !bridge.elevenLabsClient.isReady()) {
      return;
    }

    try {
      // Convert mu-law to PCM16 (16kHz for ElevenLabs)
      const pcm16Buffer = convertTwilioAudioToPCM16(base64MuLaw, 16000);
      bridge.bytesIn += pcm16Buffer.length;

      // Send audio input to ElevenLabs (expects base64 PCM16)
      bridge.elevenLabsClient.sendAudioInput(pcm16Buffer);
      
      if (bridge.bytesIn % 16000 === 0) { // Log every ~1 second of audio
        console.log(`[ElevenLabsBridge] Audio sent callSid=${bridge.callSid} bytesIn=${bridge.bytesIn} bytesOut=${bridge.bytesOut}`);
      }
    } catch (error: any) {
      console.error(`[ElevenLabsBridge] Error processing Twilio audio:`, error.message);
    }
  }

  /**
   * Handle ElevenLabs error with reconnection logic
   */
  private async handleElevenLabsError(bridge: BridgeSession, error: Error): Promise<void> {
    bridge.reconnectAttempts += 1;

    if (bridge.reconnectAttempts <= this.MAX_RECONNECT_ATTEMPTS) {
      console.log(`[ElevenLabsBridge] Reconnecting attempt=${bridge.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} callSid=${bridge.callSid}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * bridge.reconnectAttempts)); // Exponential backoff
      await this.connectToElevenLabs(bridge);
    } else {
      console.error(`[ElevenLabsBridge] Max reconnection attempts reached callSid=${bridge.callSid}, closing bridge`);
      this.closeBridge(bridge.callSid, 'ElevenLabs connection failed');
    }
  }

  /**
   * Handle ElevenLabs disconnect
   */
  private handleElevenLabsDisconnect(bridge: BridgeSession): void {
    if (bridge.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      // Try to reconnect
      this.handleElevenLabsError(bridge, new Error('ElevenLabs disconnected'));
    } else {
      this.closeBridge(bridge.callSid, 'ElevenLabs disconnected');
    }
  }

  /**
   * Close bridge and cleanup
   */
  closeBridge(callSid: string, reason?: string): void {
    const bridge = this.bridges.get(callSid);
    if (!bridge) {
      return;
    }

    const duration = Date.now() - bridge.startTime.getTime();
    console.log(`[ElevenLabsBridge] Closing bridge callSid=${callSid} reason=${reason || 'unknown'} duration=${Math.round(duration / 1000)}s bytesIn=${bridge.bytesIn} bytesOut=${bridge.bytesOut}`);

    if (bridge.elevenLabsClient) {
      try {
        bridge.elevenLabsClient.disconnect();
      } catch (error) {
        console.error(`[ElevenLabsBridge] Error disconnecting ElevenLabs:`, error);
      }
    }

    this.bridges.delete(callSid);
  }

  /**
   * Get bridge by callSid
   */
  getBridge(callSid: string): BridgeSession | undefined {
    return this.bridges.get(callSid);
  }

  /**
   * Cleanup all bridges (for graceful shutdown)
   */
  cleanup(): void {
    for (const [callSid] of this.bridges.entries()) {
      this.closeBridge(callSid, 'Service shutdown');
    }
    console.log('[ElevenLabsBridge] All bridges cleaned up');
  }
}

export const elevenLabsBridgeService = new ElevenLabsBridgeService();
