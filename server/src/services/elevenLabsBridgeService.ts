import WebSocket from 'ws';
import { ElevenLabsStreamingClient, ConversationConfig, ElevenLabsStreamCallbacks } from '../voice-agent/voice/elevenLabsStreaming';
import { twilioMediaStreamService, TwilioMediaStreamSession } from './twilioMediaStreamService';
import { convertTwilioAudioToPCM16, convertPCM16ToTwilioAudio } from './audioConversionService';
import { supabaseAdmin } from './supabaseDb';
import { ensureAgentConfig } from './supabaseDb';
import { voiceAgentConfig } from '../voice-agent/config';
import { logger, serializeError, redact } from '../utils/logger';

export interface TranscriptSegment {
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

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
  transcriptSegments: TranscriptSegment[];
  elevenConversationId: string | null;
  ragStats: {
    enabled: boolean;
    totalQueries: number;
    totalResults: number;
    totalInjectedChars: number;
    lastQuery?: {
      query: string;
      results: number;
      injectedChars: number;
    };
    topSources?: Array<{
      documentId: string;
      chunkIndex: number;
      score: number;
      title?: string;
      fileName?: string;
    }>;
  };
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
   * 1. From call_logs (if call was already logged via handleInboundVoice upsert)
   * 2. From phone_numbers via To number from customParameters (fallback)
   */
  private async resolveLocationIdFromCallSid(callSid: string, phoneNumber?: string): Promise<string | null> {
    try {
      // Method 1: Try to get from call_logs first (should exist after handleInboundVoice upsert)
      const { data: callLog } = await supabaseAdmin
        .from('call_logs')
        .select('location_id')
        .eq('call_sid', callSid)
        .maybeSingle();

      if (callLog?.location_id) {
        logger.info('elevenlabs.bridge.location_resolved', redact({
          callSid,
          locationId: callLog.location_id,
          source: 'call_logs',
        }));
        return callLog.location_id;
      }

      // Method 2: Fallback - Try to get from phone_numbers if phoneNumber provided (from customParameters)
      if (phoneNumber) {
        logger.info('elevenlabs.bridge.location_resolve_fallback', redact({
          callSid,
          phoneNumber,
        }));
        const { data: phoneData } = await supabaseAdmin
          .from('phone_numbers')
          .select('location_id')
          .or(`e164.eq.${phoneNumber},customer_public_number.eq.${phoneNumber}`)
          .limit(1)
          .maybeSingle();

        if (phoneData?.location_id) {
          logger.info('elevenlabs.bridge.location_resolved', redact({
            callSid,
            locationId: phoneData.location_id,
            source: 'phone_numbers',
          }));
          return phoneData.location_id;
        }
      }

      return null;
    } catch (error) {
      logger.error('elevenlabs.bridge.location_resolve_failed', error, redact({
        callSid,
        phoneNumber,
      }));
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
      logger.error('elevenlabs.bridge.agent_config_failed', error, redact({
        locationId,
      }));
      return null;
    }
  }

  /**
   * Create bridge session
   */
  async createBridge(callSid: string, twilioSession: TwilioMediaStreamSession, phoneNumber?: string): Promise<void> {
    // Resolve locationId (try call_logs first, then fallback to phoneNumber from customParameters)
    const locationId = await this.resolveLocationIdFromCallSid(callSid, phoneNumber || twilioSession.phoneNumber);
    if (!locationId) {
      console.error(`[ElevenLabsBridge] Could not resolve locationId for callSid=${callSid} phoneNumber=${phoneNumber || twilioSession.phoneNumber || 'none'}, closing session`);
      // Close WebSocket session cleanly if locationId cannot be resolved
      twilioMediaStreamService.cleanupSession(callSid, 'locationId resolution failed');
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
      transcriptSegments: [],
      elevenConversationId: null,
      ragStats: {
        enabled: voiceAgentConfig.rag.enabled,
        totalQueries: 0,
        totalResults: 0,
        totalInjectedChars: 0,
        topSources: [],
      },
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
            logger.error('elevenlabs.bridge.audio_outbound_failed', error, redact({
              callSid: bridge.callSid,
              locationId: bridge.locationId,
            }));
          }
        },
        onTranscription: (text: string, isFinal: boolean) => {
          logger.info('elevenlabs.bridge.transcription', redact({
            callSid: bridge.callSid,
            locationId: bridge.locationId,
            text: text.substring(0, 100), // Limit text length
            isFinal,
          }));
          
          // Collect transcript segments
          bridge.transcriptSegments.push({
            text,
            timestamp: new Date(),
            isFinal,
          });
        },
        onError: (error: Error) => {
          logger.error('elevenlabs.bridge.error', error, redact({
            callSid: bridge.callSid,
            locationId: bridge.locationId,
          }));
          this.handleElevenLabsError(bridge, error);
        },
        onClose: () => {
          logger.info('elevenlabs.bridge.disconnected', redact({
            callSid: bridge.callSid,
            locationId: bridge.locationId,
          }));
          this.handleElevenLabsDisconnect(bridge);
        },
        onOpen: () => {
          logger.info('elevenlabs.bridge.connected', redact({
            callSid: bridge.callSid,
            locationId: bridge.locationId,
          }));
        },
        onConversationInitiated: (conversationId: string) => {
          bridge.elevenConversationId = conversationId;
          logger.info('elevenlabs.bridge.conversation_initiated', redact({
            callSid: bridge.callSid,
            locationId: bridge.locationId,
            conversationId,
          }));
        },
        onRagQuery: (stats) => {
          if (bridge.ragStats.enabled) {
            bridge.ragStats.totalQueries += 1;
            bridge.ragStats.totalResults += stats.resultsCount;
            bridge.ragStats.totalInjectedChars += stats.injectedChars;
            bridge.ragStats.lastQuery = {
              query: stats.query,
              results: stats.resultsCount,
              injectedChars: stats.injectedChars,
            };
            // Update topSources (keep max 5, sorted by score descending)
            if (stats.topSources && stats.topSources.length > 0) {
              const combined = [...(bridge.ragStats.topSources || []), ...stats.topSources];
              bridge.ragStats.topSources = combined
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
            }
            console.log(`[ElevenLabsBridge] RAG query callSid=${bridge.callSid} results=${stats.resultsCount} injectedChars=${stats.injectedChars} totalQueries=${bridge.ragStats.totalQueries}`);
          }
        },
      };

      const client = new ElevenLabsStreamingClient(config, callbacks);
      await client.connect();
      bridge.elevenLabsClient = client;
      bridge.reconnectAttempts = 0;
      
      // Store conversation ID when available (will be set in onTranscription or via client property if available)
      // Note: conversationId is set internally in ElevenLabsStreamingClient, we'll capture it later if needed

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
        logger.info('elevenlabs.bridge.audio_sent', redact({
          callSid: bridge.callSid,
          locationId: bridge.locationId,
          bytesIn: bridge.bytesIn,
          bytesOut: bridge.bytesOut,
        }));
      }
    } catch (error: any) {
      logger.error('elevenlabs.bridge.audio_process_failed', error, redact({
        callSid: bridge.callSid,
        locationId: bridge.locationId,
      }));
    }
  }

  /**
   * Handle ElevenLabs error with reconnection logic
   */
  private async handleElevenLabsError(bridge: BridgeSession, error: Error): Promise<void> {
    bridge.reconnectAttempts += 1;

    if (bridge.reconnectAttempts <= this.MAX_RECONNECT_ATTEMPTS) {
      logger.info('elevenlabs.bridge.reconnecting', redact({
        callSid: bridge.callSid,
        locationId: bridge.locationId,
        attempt: bridge.reconnectAttempts,
        maxAttempts: this.MAX_RECONNECT_ATTEMPTS,
      }));
      await new Promise((resolve) => setTimeout(resolve, 1000 * bridge.reconnectAttempts)); // Exponential backoff
      await this.connectToElevenLabs(bridge);
    } else {
      logger.error('elevenlabs.bridge.max_reconnect_reached', null, redact({
        callSid: bridge.callSid,
        locationId: bridge.locationId,
        maxAttempts: this.MAX_RECONNECT_ATTEMPTS,
      }));
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
   * Build merged transcript from final segments
   */
  private buildMergedTranscript(bridge: BridgeSession): string {
    const finalSegments = bridge.transcriptSegments.filter(s => s.isFinal);
    return finalSegments.map(s => s.text).join(' ').trim();
  }

  /**
   * Persist transcript and stats to call_logs
   */
  private async persistTranscript(bridge: BridgeSession): Promise<void> {
    try {
      const mergedTranscript = this.buildMergedTranscript(bridge);
      const finalSegmentsCount = bridge.transcriptSegments.filter(s => s.isFinal).length;

      // Get current notes_json
      const { data: existingCall } = await supabaseAdmin
        .from('call_logs')
        .select('notes_json')
        .eq('call_sid', bridge.callSid)
        .maybeSingle();

      const existingNotes = existingCall?.notes_json || {};
      
      // Update notes_json with transcript and stats
      const updatedNotes = {
        ...existingNotes,
        transcript: mergedTranscript,
        transcriptSegments: bridge.transcriptSegments.map(s => ({
          text: s.text,
          timestamp: s.timestamp.toISOString(),
          isFinal: s.isFinal,
        })),
        elevenConversationId: bridge.elevenConversationId,
        rag: bridge.ragStats.enabled ? {
          enabled: bridge.ragStats.enabled,
          totalQueries: bridge.ragStats.totalQueries,
          totalResults: bridge.ragStats.totalResults,
          totalInjectedChars: bridge.ragStats.totalInjectedChars,
          lastQuery: bridge.ragStats.lastQuery,
          topSources: bridge.ragStats.topSources && bridge.ragStats.topSources.length > 0 ? bridge.ragStats.topSources : undefined,
        } : { enabled: false },
      };

      const { error: updateError } = await supabaseAdmin
        .from('call_logs')
        .update({ notes_json: updatedNotes })
        .eq('call_sid', bridge.callSid);

      if (updateError) {
        logger.error('elevenlabs.bridge.transcript_persist_failed', updateError, redact({
          callSid: bridge.callSid,
          locationId: bridge.locationId,
        }));
      } else {
        logger.info('elevenlabs.bridge.transcript_persisted', redact({
          callSid: bridge.callSid,
          locationId: bridge.locationId,
          transcriptLength: mergedTranscript.length,
          segments: finalSegmentsCount,
          ragEnabled: bridge.ragStats.enabled,
          ragTotalQueries: bridge.ragStats.totalQueries,
          ragTotalResults: bridge.ragStats.totalResults,
          ragTotalInjectedChars: bridge.ragStats.totalInjectedChars,
        }));
      }
    } catch (error: any) {
      logger.error('elevenlabs.bridge.transcript_persist_failed', error, redact({
        callSid: bridge.callSid,
        locationId: bridge.locationId,
      }));
      // Don't throw - cleanup must continue
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

    // Persist transcript before closing
    this.persistTranscript(bridge).catch((error) => {
      console.error(`[ElevenLabsBridge] Failed to persist transcript callSid=${callSid}:`, error);
    });

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
    logger.info('elevenlabs.bridge.cleanup_complete', redact({}));
  }
}

export const elevenLabsBridgeService = new ElevenLabsBridgeService();
