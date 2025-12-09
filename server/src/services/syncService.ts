import { db } from './db';
import { elevenLabsService } from './elevenLabsService';
import { VoiceAgent } from '../models/types';

export interface SyncResult {
  agentId: string;
  success: boolean;
  errors?: string[];
  updated: boolean;
}

/**
 * Sync a single agent with ElevenLabs
 */
export async function syncAgentWithElevenLabs(agentId: string): Promise<SyncResult> {
  const errors: string[] = [];
  let updated = false;

  try {
    const agent = db.getAgent(agentId);
    if (!agent) {
      return {
        agentId,
        success: false,
        errors: ['Agent not found'],
        updated: false,
      };
    }

    if (!agent.elevenLabsAgentId) {
      return {
        agentId,
        success: false,
        errors: ['Agent has no ElevenLabs ID'],
        updated: false,
      };
    }

    // 1. Sync agent status
    try {
      const elevenLabsStatus = await elevenLabsService.getAgentStatus(agent.elevenLabsAgentId);
      // Status is verified, agent exists in ElevenLabs
    } catch (error) {
      errors.push(`Failed to get agent status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 2. Sync phone number status if assigned
    if (agent.telephony?.phoneNumberId) {
      try {
        const phoneStatus = await elevenLabsService.getPhoneNumberStatus(agent.telephony.phoneNumberId);
        if (agent.telephony.status !== phoneStatus.status) {
          agent.telephony.status = phoneStatus.status as any;
          updated = true;
        }
      } catch (error) {
        errors.push(`Failed to sync phone number status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 3. Sync voice clone if exists
    if (agent.voiceCloning?.voiceId) {
      try {
        const voiceClone = await elevenLabsService.getVoiceClone(agent.voiceCloning.voiceId);
        // Voice clone exists and is valid
      } catch (error) {
        errors.push(`Failed to verify voice clone: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update agent timestamp
    if (updated) {
      agent.updatedAt = new Date();
      db.saveAgent(agent);
    }

    return {
      agentId,
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      updated,
    };
  } catch (error) {
    return {
      agentId,
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      updated: false,
    };
  }
}

/**
 * Sync all agents with ElevenLabs
 */
export async function syncAllAgents(): Promise<SyncResult[]> {
  const agents = db.getAllAgents();
  const results: SyncResult[] = [];

  for (const agent of agents) {
    // Only sync agents that have ElevenLabs IDs
    if (agent.elevenLabsAgentId) {
      const result = await syncAgentWithElevenLabs(agent.id);
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Handle ElevenLabs webhook events
 */
export interface ElevenLabsWebhookEvent {
  event: string;
  agent_id?: string;
  phone_number_id?: string;
  voice_id?: string;
  data?: any;
  timestamp: string;
}

export async function handleElevenLabsWebhook(event: ElevenLabsWebhookEvent): Promise<{ success: boolean; message: string }> {
  try {
    switch (event.event) {
      case 'agent.status_changed':
        if (event.agent_id) {
          // Find agent by ElevenLabs ID
          const agents = db.getAllAgents();
          const agent = agents.find(a => a.elevenLabsAgentId === event.agent_id);
          if (agent) {
            // Sync agent status
            await syncAgentWithElevenLabs(agent.id);
            return { success: true, message: 'Agent status synced' };
          }
        }
        break;

      case 'phone_number.status_changed':
        if (event.phone_number_id) {
          // Find agent with this phone number
          const agents = db.getAllAgents();
          const agent = agents.find(a => a.telephony?.phoneNumberId === event.phone_number_id);
          if (agent) {
            await syncAgentWithElevenLabs(agent.id);
            return { success: true, message: 'Phone number status synced' };
          }
        }
        break;

      case 'voice.clone.completed':
        if (event.voice_id) {
          // Find agent with this voice clone
          const agents = db.getAllAgents();
          const agent = agents.find(a => a.voiceCloning?.voiceId === event.voice_id);
          if (agent) {
            // Voice clone is ready, update agent
            if (agent.voiceCloning) {
              agent.voiceCloning.createdAt = new Date(event.timestamp);
            }
            agent.updatedAt = new Date();
            db.saveAgent(agent);
            return { success: true, message: 'Voice clone status updated' };
          }
        }
        break;

      default:
        return { success: false, message: `Unknown event type: ${event.event}` };
    }

    return { success: true, message: 'Webhook processed' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process webhook',
    };
  }
}

