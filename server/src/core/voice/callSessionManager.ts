/**
 * Call Session Manager
 * Manages voice call sessions and turn-based conversation flow
 */

import { supabaseAdmin } from '../../services/supabaseDb';
import { asrService } from '../../services/asrService';
import { ttsService } from '../../services/ttsService';
import { agentCore } from '../agent/agentCore';
import { logger, redact } from '../../utils/logger';

export interface CallSession {
  id: string;
  callSid: string;
  locationId: string;
  agentId?: string;
  status: 'active' | 'completed' | 'failed';
  transcript: Array<{
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
  }>;
  startedAt: Date;
  endedAt?: Date;
}

export interface ProcessTurnResult {
  text: string;
  audioUrl: string;
  transcription: string;
}

export class CallSessionManager {
  private activeSessions: Map<string, CallSession> = new Map();

  /**
   * Create or get call session
   */
  async getOrCreateSession(
    callSid: string,
    locationId: string,
    agentId?: string
  ): Promise<CallSession> {
    // Check if session exists in memory
    let session = this.activeSessions.get(callSid);

    if (!session) {
      // Try to load from DB
      const { data: dbSession } = await supabaseAdmin
        .from('call_sessions')
        .select('*')
        .eq('call_sid', callSid)
        .maybeSingle();

      if (dbSession) {
        session = {
          id: dbSession.id,
          callSid: dbSession.call_sid,
          locationId: dbSession.location_id,
          agentId: dbSession.agent_id || undefined,
          status: dbSession.status as any,
          transcript: (dbSession.transcript_json as any[]) || [],
          startedAt: new Date(dbSession.started_at),
          endedAt: dbSession.ended_at ? new Date(dbSession.ended_at) : undefined,
        };
        this.activeSessions.set(callSid, session);
      } else {
        // Create new session
        const { data: newSession, error } = await supabaseAdmin
          .from('call_sessions')
          .insert({
            call_sid: callSid,
            location_id: locationId,
            agent_id: agentId || null,
            direction: 'test',
            status: 'active',
            transcript_json: [],
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create call session: ${error.message}`);
        }

        session = {
          id: newSession.id,
          callSid: newSession.call_sid,
          locationId: newSession.location_id,
          agentId: newSession.agent_id || undefined,
          status: newSession.status as any,
          transcript: [],
          startedAt: new Date(newSession.started_at),
        };

        this.activeSessions.set(callSid, session);
      }
    }

    return session;
  }

  /**
   * Process a turn: ASR → AgentCore → TTS
   */
  async processTurn(
    callSid: string,
    audioBuffer: Buffer,
    language?: string
  ): Promise<ProcessTurnResult> {
    const session = await this.getOrCreateSession(callSid, 'unknown'); // locationId will be set from DB

    try {
      // Step 1: ASR - Transcribe audio
      logger.info('call_session.asr_start', redact({ callSid }));
      const transcription = await asrService.transcribe(audioBuffer, language || 'de');

      if (!transcription.text || transcription.text.trim().length === 0) {
        throw new Error('No speech detected');
      }

      logger.info('call_session.asr_complete', redact({
        callSid,
        textLength: transcription.text.length,
      }));

      // Step 2: Update transcript with user message
      session.transcript.push({
        role: 'user',
        text: transcription.text,
        timestamp: new Date().toISOString(),
      });

      await this.saveTranscript(session);

      // Step 3: AgentCore - Get LLM response
      logger.info('call_session.agentcore_start', redact({ callSid }));
      const agentResponse = await agentCore.handleMessage({
        locationId: session.locationId,
        channel: 'voice',
        externalUserId: `call_${callSid}`,
        text: transcription.text,
        metadata: {
          call_sid: callSid,
          agent_id: session.agentId,
        },
      });

      logger.info('call_session.agentcore_complete', redact({
        callSid,
        responseLength: agentResponse.text.length,
      }));

      // Step 4: Update transcript with assistant response
      session.transcript.push({
        role: 'assistant',
        text: agentResponse.text,
        timestamp: new Date().toISOString(),
      });

      await this.saveTranscript(session);

      // Step 5: TTS - Synthesize response
      logger.info('call_session.tts_start', redact({ callSid }));
      const voicePreset = await this.getVoicePreset(session.locationId);
      const audioPath = await ttsService.synthesizeToFile(
        agentResponse.text,
        voicePreset,
        { language: 'de', speed: 1.0 }
      );

      logger.info('call_session.turn_complete', redact({
        callSid,
        audioPath,
      }));

      return {
        text: agentResponse.text,
        audioUrl: audioPath, // Local file path (FreeSWITCH can access)
        transcription: transcription.text,
      };
    } catch (error: any) {
      logger.error('call_session.process_turn_failed', error, redact({ callSid }));

      // Return fallback response
      const fallbackText = 'Entschuldigung, ich habe Sie nicht verstanden. Bitte wiederholen Sie.';
      const voicePreset = await this.getVoicePreset(session.locationId);
      const audioPath = await ttsService.synthesizeToFile(fallbackText, voicePreset, {
        language: 'de',
      });

      return {
        text: fallbackText,
        audioUrl: audioPath,
        transcription: '',
      };
    }
  }

  /**
   * End call session
   */
  async endSession(callSid: string): Promise<void> {
    const session = this.activeSessions.get(callSid);
    if (!session) {
      return;
    }

    session.status = 'completed';
    session.endedAt = new Date();

    await supabaseAdmin
      .from('call_sessions')
      .update({
        status: 'completed',
        ended_at: session.endedAt.toISOString(),
        transcript_json: session.transcript,
      })
      .eq('call_sid', callSid);

    this.activeSessions.delete(callSid);

    logger.info('call_session.ended', redact({ callSid }));
  }

  /**
   * Get greeting audio for call start
   */
  async getGreeting(locationId: string): Promise<Buffer> {
    // Get agent config for greeting text
    const { data: agentConfig } = await supabaseAdmin
      .from('agent_configs')
      .select('booking_greeting')
      .eq('location_id', locationId)
      .maybeSingle();

    const greetingText = agentConfig?.booking_greeting || 'Grüezi, wie kann ich Ihnen helfen?';

    // Get voice profile
    const voicePreset = await this.getVoicePreset(locationId);

    // Synthesize greeting
    return await ttsService.synthesize(greetingText, voicePreset, {
      language: 'de',
    });
  }

  /**
   * Save transcript to DB
   */
  private async saveTranscript(session: CallSession): Promise<void> {
    await supabaseAdmin
      .from('call_sessions')
      .update({
        transcript_json: session.transcript,
      })
      .eq('call_sid', session.callSid);
  }

  /**
   * Get voice preset for location
   */
  private async getVoicePreset(locationId: string): Promise<string> {
    const { data: agentConfig } = await supabaseAdmin
      .from('agent_configs')
      .select('voice_profile_id')
      .eq('location_id', locationId)
      .maybeSingle();

    if (agentConfig?.voice_profile_id) {
      const { data: voiceProfile } = await supabaseAdmin
        .from('voice_profiles')
        .select('preset')
        .eq('id', agentConfig.voice_profile_id)
        .maybeSingle();

      if (voiceProfile?.preset) {
        return voiceProfile.preset;
      }
    }

    return 'SwissProfessionalDE'; // Default
  }
}

export const callSessionManager = new CallSessionManager();

