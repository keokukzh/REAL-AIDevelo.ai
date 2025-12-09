import axios from 'axios';
import { AgentConfig } from '../models/types';
import { config } from '../config/env';
import { InternalServerError } from '../utils/errors';

const API_BASE = 'https://api.elevenlabs.io/v1';

export class ElevenLabsService {
  /**
   * Fetch available voices filtering for language suitability
   */
  async getVoices(locale: string = 'de') {
    if (!config.isElevenLabsConfigured) {
      // Return default voices for testing
      return [
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', category: 'premade' },
      ];
    }
    
    try {
      const response = await axios.get(`${API_BASE}/voices`, {
        headers: { 'xi-api-key': config.elevenLabsApiKey },
        timeout: 10000 // 10 second timeout
      });
      
      const allVoices = response.data.voices;
      // Simple logic to return relevant voices (in reality, we might filter by 'labels' or specific IDs known to be good)
      // For now, return top 10 to avoid payload bloat
      return allVoices.slice(0, 10);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new InternalServerError(
          `Failed to fetch voices from ElevenLabs: ${error.message}`
        );
      }
      throw new InternalServerError('Failed to fetch voices from ElevenLabs');
    }
  }

  /**
   * Create a Conversational Agent in ElevenLabs
   */
  async createAgent(agentName: string, agentConfig: AgentConfig): Promise<string> {
    try {
      const payload = {
        name: agentName,
        conversation_config: {
          agent: {
            prompt: {
              prompt: agentConfig.systemPrompt
            },
            first_message: "Grüezi, hier ist der virtuelle Assistent von " + agentName, // Dynamic first message
            language: "de" // Default to German for now, mapped from agentConfig.primaryLocale
          },
          tts: {
            voice_id: agentConfig.elevenLabs.voiceId
          }
        }
      };

      const response = await axios.post(`${API_BASE}/convai/agents/create`, payload, {
        headers: { 
          'xi-api-key': config.elevenLabsApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout for agent creation
      });

      return response.data.agent_id;
    } catch (error) {
        // Detailed error logging
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data 
            ? JSON.stringify(error.response.data)
            : error.message;
          throw new InternalServerError(
            `ElevenLabs Agent Creation Failed: ${errorMessage}`
          );
        }
        throw new InternalServerError('Failed to create agent in ElevenLabs');
    }
  }

  /**
   * Generate speech from text using ElevenLabs TTS
   */
  async generateSpeech(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM', modelId: string = 'eleven_multilingual_v2'): Promise<Buffer> {
    // Check if API key is configured
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError(
        'ElevenLabs API key is not configured. Please set ELEVENLABS_API_KEY in your .env file. ' +
        'Get your API key from: https://elevenlabs.io/app/settings/api-keys'
      );
    }
    
    try {
      const response = await axios.post(
        `${API_BASE}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': config.elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        let errorMessage = error.message;
        
        // Try to parse error response
        if (error.response?.data) {
          try {
            // If data is already an object, stringify it
            if (typeof error.response.data === 'object' && !Buffer.isBuffer(error.response.data)) {
              errorMessage = JSON.stringify(error.response.data);
            } 
            // If data is a Buffer or ArrayBuffer, try to parse as text
            else if (Buffer.isBuffer(error.response.data) || error.response.data instanceof ArrayBuffer) {
              let text: string;
              if (Buffer.isBuffer(error.response.data)) {
                text = error.response.data.toString('utf-8');
              } else {
                text = Buffer.from(new Uint8Array(error.response.data)).toString('utf-8');
              }
              try {
                const parsed = JSON.parse(text);
                errorMessage = JSON.stringify(parsed);
              } catch {
                errorMessage = text || error.message;
              }
            }
            // If data is a string, use it directly
            else if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            }
            // Otherwise stringify
            else {
              errorMessage = JSON.stringify(error.response.data);
            }
          } catch (parseError) {
            // If parsing fails, use status text or default message
            errorMessage = error.response.statusText || error.message;
          }
        }
        
        // Extract meaningful error message
        let userFriendlyMessage = 'ElevenLabs TTS Generation Failed';
        if (error.response?.status === 401) {
          userFriendlyMessage = 'ElevenLabs API-Schlüssel ungültig oder abgelaufen. Bitte überprüfen Sie Ihre API-Konfiguration.';
        } else if (error.response?.status === 429) {
          userFriendlyMessage = 'ElevenLabs API-Rate-Limit erreicht. Bitte versuchen Sie es später erneut.';
        } else if (error.response?.status === 400) {
          userFriendlyMessage = 'Ungültige Anfrage an ElevenLabs API. Bitte überprüfen Sie die Parameter.';
        } else if (errorMessage && errorMessage.length < 500) {
          // Only include error message if it's not too long
          userFriendlyMessage = `ElevenLabs TTS Generation Failed: ${errorMessage}`;
        }
        
        throw new InternalServerError(userFriendlyMessage);
      }
      throw new InternalServerError('Failed to generate speech from ElevenLabs');
    }
  }

    /**
   * Trigger a test simulation
   * NOTE: This is a simplified call assuming we want to start a session or similar.
   * The actual 'simulate' endpoint might vary or require Stream integration.
   */
  async getAgentLink(agentId: string) {
       // Return the widget link for simplicity in V1
       return `https://elevenlabs.io/app/talk-to?agent_id=${agentId}`;
  }
}

export const elevenLabsService = new ElevenLabsService();
