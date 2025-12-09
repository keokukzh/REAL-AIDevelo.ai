import axios from 'axios';
import { AgentConfig, PhoneNumber, PhoneSettings, PhoneStatus } from '../models/types';
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

  /**
   * Create a voice clone from audio
   */
  async createVoiceClone(audioBuffer: Buffer, name: string, mimeType: string = 'audio/mpeg'): Promise<string> {
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError('ElevenLabs API key is not configured');
    }

    try {
      // Use form-data library for multipart/form-data
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('files', audioBuffer, {
        filename: 'voice-clone.mp3',
        contentType: mimeType,
      });

      const response = await axios.post(`${API_BASE}/voices/add`, formData, {
        headers: {
          'xi-api-key': config.elevenLabsApiKey,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for voice cloning
      });

      return response.data.voice_id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `ElevenLabs Voice Clone Creation Failed: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to create voice clone in ElevenLabs');
    }
  }

  /**
   * Get voice clone details
   */
  async getVoiceClone(voiceId: string): Promise<{
    voice_id: string;
    name: string;
    samples?: Array<{ sample_id: string; file_name: string }>;
    category?: string;
    fine_tuning?: any;
  }> {
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError('ElevenLabs API key is not configured');
    }

    try {
      const response = await axios.get(`${API_BASE}/voices/${voiceId}`, {
        headers: { 'xi-api-key': config.elevenLabsApiKey },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `Failed to get voice clone: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to get voice clone from ElevenLabs');
    }
  }

  /**
   * Delete a voice clone
   */
  async deleteVoiceClone(voiceId: string): Promise<void> {
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError('ElevenLabs API key is not configured');
    }

    try {
      await axios.delete(`${API_BASE}/voices/${voiceId}`, {
        headers: { 'xi-api-key': config.elevenLabsApiKey },
        timeout: 10000,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `Failed to delete voice clone: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to delete voice clone from ElevenLabs');
    }
  }

  /**
   * Update an agent in ElevenLabs
   */
  async updateAgent(agentId: string, updates: {
    name?: string;
    prompt?: string;
    voiceId?: string;
    firstMessage?: string;
  }): Promise<void> {
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError('ElevenLabs API key is not configured');
    }

    try {
      const payload: any = {};
      
      if (updates.name) payload.name = updates.name;
      if (updates.prompt || updates.voiceId || updates.firstMessage) {
        payload.conversation_config = {};
        if (updates.prompt || updates.firstMessage) {
          payload.conversation_config.agent = {};
          if (updates.prompt) {
            payload.conversation_config.agent.prompt = { prompt: updates.prompt };
          }
          if (updates.firstMessage) {
            payload.conversation_config.agent.first_message = updates.firstMessage;
          }
        }
        if (updates.voiceId) {
          payload.conversation_config.tts = { voice_id: updates.voiceId };
        }
      }

      await axios.patch(`${API_BASE}/convai/agents/${agentId}`, payload, {
        headers: {
          'xi-api-key': config.elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `Failed to update agent in ElevenLabs: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to update agent in ElevenLabs');
    }
  }

  /**
   * Get agent status from ElevenLabs
   */
  async getAgentStatus(agentId: string): Promise<{
    agent_id: string;
    status: string;
    name?: string;
    created_at?: string;
  }> {
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError('ElevenLabs API key is not configured');
    }

    try {
      const response = await axios.get(`${API_BASE}/convai/agents/${agentId}`, {
        headers: { 'xi-api-key': config.elevenLabsApiKey },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `Failed to get agent status: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to get agent status from ElevenLabs');
    }
  }

  /**
   * Sync agent with ElevenLabs (get latest status and update)
   */
  async syncAgent(agentId: string): Promise<void> {
    // This will be implemented to sync agent status
    // For now, just get the status
    await this.getAgentStatus(agentId);
  }

  /**
   * Get available phone numbers from ElevenLabs Telephony
   */
  async getAvailablePhoneNumbers(country: string = 'CH'): Promise<PhoneNumber[]> {
    if (!config.isElevenLabsConfigured) {
      // Return mock data for testing
      return [
        { id: 'mock_1', number: '+41 44 123 45 67', country: 'CH', status: 'available' },
        { id: 'mock_2', number: '+41 44 123 45 68', country: 'CH', status: 'available' },
      ];
    }

    try {
      const response = await axios.get(`${API_BASE}/telephony/phone-numbers`, {
        headers: { 'xi-api-key': config.elevenLabsApiKey },
        params: { country },
        timeout: 10000,
      });

      return response.data.phone_numbers?.map((pn: any) => ({
        id: pn.id,
        number: pn.number,
        country: pn.country || country,
        status: pn.status || 'available',
        agentId: pn.agent_id,
      })) || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `Failed to fetch phone numbers: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to fetch phone numbers from ElevenLabs');
    }
  }

  /**
   * Assign a phone number to an agent
   */
  async assignPhoneNumber(agentId: string, phoneNumberId?: string): Promise<PhoneNumber> {
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError('ElevenLabs API key is not configured');
    }

    try {
      // If no phoneNumberId provided, get first available number
      let targetPhoneNumberId = phoneNumberId;
      if (!targetPhoneNumberId) {
        const availableNumbers = await this.getAvailablePhoneNumbers('CH');
        const available = availableNumbers.find(pn => pn.status === 'available');
        if (!available) {
          throw new InternalServerError('No available phone numbers found');
        }
        targetPhoneNumberId = available.id;
      }

      const response = await axios.post(
        `${API_BASE}/telephony/phone-numbers/${targetPhoneNumberId}/assign`,
        { agent_id: agentId },
        {
          headers: {
            'xi-api-key': config.elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        id: response.data.id || targetPhoneNumberId,
        number: response.data.number,
        country: response.data.country || 'CH',
        status: 'assigned',
        agentId: agentId,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `Failed to assign phone number: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to assign phone number in ElevenLabs');
    }
  }

  /**
   * Update phone number settings
   */
  async updatePhoneNumberSettings(phoneNumberId: string, settings: PhoneSettings): Promise<void> {
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError('ElevenLabs API key is not configured');
    }

    try {
      const payload: any = {
        agent_id: settings.agentId,
      };
      
      if (settings.greetingMessage) {
        payload.greeting_message = settings.greetingMessage;
      }
      if (settings.voicemailEnabled !== undefined) {
        payload.voicemail_enabled = settings.voicemailEnabled;
      }
      if (settings.callRecordingEnabled !== undefined) {
        payload.call_recording_enabled = settings.callRecordingEnabled;
      }

      await axios.patch(`${API_BASE}/telephony/phone-numbers/${phoneNumberId}`, payload, {
        headers: {
          'xi-api-key': config.elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `Failed to update phone number settings: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to update phone number settings in ElevenLabs');
    }
  }

  /**
   * Get phone number status
   */
  async getPhoneNumberStatus(phoneNumberId: string): Promise<PhoneStatus> {
    if (!config.isElevenLabsConfigured) {
      throw new InternalServerError('ElevenLabs API key is not configured');
    }

    try {
      const response = await axios.get(`${API_BASE}/telephony/phone-numbers/${phoneNumberId}`, {
        headers: { 'xi-api-key': config.elevenLabsApiKey },
        timeout: 10000,
      });

      return {
        phoneNumberId: response.data.id || phoneNumberId,
        status: response.data.status || 'inactive',
        agentId: response.data.agent_id,
        lastCallAt: response.data.last_call_at ? new Date(response.data.last_call_at) : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(
          `Failed to get phone number status: ${errorMessage}`
        );
      }
      throw new InternalServerError('Failed to get phone number status from ElevenLabs');
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
