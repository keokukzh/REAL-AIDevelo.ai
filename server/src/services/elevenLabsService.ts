import axios from 'axios';
import { AgentConfig, VoiceAgent } from '../models/types';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_BASE = 'https://api.elevenlabs.io/v1';

export class ElevenLabsService {
  /**
   * Fetch available voices filtering for language suitability
   */
  async getVoices(locale: string = 'de') {
    try {
      const response = await axios.get(`${API_BASE}/voices`, {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY }
      });
      
      const allVoices = response.data.voices;
      // Simple logic to return relevant voices (in reality, we might filter by 'labels' or specific IDs known to be good)
      // For now, return top 10 to avoid payload bloat
      return allVoices.slice(0, 10);
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw new Error('Failed to fetch voices from ElevenLabs');
    }
  }

  /**
   * Create a Conversational Agent in ElevenLabs
   */
  async createAgent(agentName: string, config: AgentConfig): Promise<string> {
    try {
      const payload = {
        name: agentName,
        conversation_config: {
          agent: {
            prompt: {
              prompt: config.systemPrompt
            },
            first_message: "Grüezi, hier ist der virtuelle Assistent von " + agentName, // Dynamic first message
            language: "de" // Default to German for now, mapped from config.primaryLocale
          },
          tts: {
            voice_id: config.elevenLabs.voiceId
          }
        }
      };

      const response = await axios.post(`${API_BASE}/convai/agents/create`, payload, {
        headers: { 
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      return response.data.agent_id;
    } catch (error) {
        // Detailed error logging
        if (axios.isAxiosError(error)) {
            console.error('ElevenLabs API Error:', error.response?.data);
            throw new Error(`ElevenLabs Agent Creation Failed: ${JSON.stringify(error.response?.data)}`);
        }
        throw error;
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
