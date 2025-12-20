import { apiRequest } from './api';

export interface ElevenLabsAgent {
  agent_id: string;
  name: string;
  language?: string;
  [key: string]: any;
}

export interface AgentListResponse {
  agents: ElevenLabsAgent[];
  currentConfig: {
    databaseAgentId: string | null;
    defaultAgentId: string;
    locationId: string | null;
  };
  recommendations: {
    useAgentId: string;
  agentExists: boolean;
  [key: string]: any;
  };
}

/**
 * List all available ElevenLabs agents
 * Only available in development mode
 */
export async function listElevenLabsAgents(): Promise<AgentListResponse> {
  try {
    const response = await apiRequest<{ success: boolean; data: AgentListResponse }>(
      '/dev/elevenlabs/list-agents',
      {
        method: 'GET',
      }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to list agents');
  } catch (error: any) {
    // In production, this endpoint might not be available
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      throw new Error('Agent listing is only available in development mode');
    }
    throw error;
  }
}

/**
 * Test connection to a specific ElevenLabs agent
 */
export async function testElevenLabsAgent(agentId: string, locationId?: string): Promise<{
  success: boolean;
  agentId: string;
  agentExists: boolean;
  agentName?: string;
  agentLanguage?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest<{
      success: boolean;
      data: {
        agentId: string;
        locationId?: string;
        agentExists: boolean;
        agentName?: string;
        agentLanguage?: string;
      };
      error?: string;
    }>('/dev/elevenlabs/test-connection', {
      method: 'POST',
      data: {
        agentId,
        locationId,
      },
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        agentId: response.data.agentId,
        agentExists: response.data.agentExists,
        agentName: response.data.agentName,
        agentLanguage: response.data.agentLanguage,
      };
    }
    
    return {
      success: false,
      agentId,
      agentExists: false,
      error: response.error || 'Unknown error',
    };
  } catch (error: any) {
    // In production, this endpoint might not be available
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      return {
        success: false,
        agentId,
        agentExists: false,
        error: 'Agent testing is only available in development mode',
      };
    }
    
    if (error?.response?.status === 404 && error?.response?.data?.error === 'Agent not found') {
      return {
        success: false,
        agentId,
        agentExists: false,
        error: error.response.data.message || 'Agent not found',
      };
    }
    
    return {
      success: false,
      agentId,
      agentExists: false,
      error: error?.response?.data?.message || error?.message || 'Unknown error',
    };
  }
}
