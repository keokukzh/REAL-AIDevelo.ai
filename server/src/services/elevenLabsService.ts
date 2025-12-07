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
