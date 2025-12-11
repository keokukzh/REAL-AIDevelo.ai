import { v4 as uuidv4 } from 'uuid';
import { VoiceAgent } from '../models/types';
import { generateDefaultAgentForUser } from '../data/defaultAgentTemplate';
import { db } from './db';
import { getPool, query } from './database';

/**
 * Service for managing default agent provisioning
 */
export class DefaultAgentService {
  private async persistAgent(agent: VoiceAgent) {
    if (!getPool()) {
      return;
    }

    await query(
      `INSERT INTO agents (
         id, eleven_labs_agent_id, business_profile, config, subscription, telephony, voice_cloning, status, metadata, created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET
         business_profile = EXCLUDED.business_profile,
         config = EXCLUDED.config,
         subscription = EXCLUDED.subscription,
         telephony = EXCLUDED.telephony,
         voice_cloning = EXCLUDED.voice_cloning,
         status = EXCLUDED.status,
         metadata = EXCLUDED.metadata,
         updated_at = EXCLUDED.updated_at`,
      [
        agent.id,
        agent.elevenLabsAgentId || null,
        agent.businessProfile,
        agent.config,
        agent.subscription || null,
        agent.telephony || null,
        agent.voiceCloning || null,
        agent.status,
        agent.metadata || null,
        agent.createdAt,
        agent.updatedAt,
      ]
    );
  }

  /**
   * Create a default agent for a new user
   * @param userId - User ID to associate the agent with
   * @param userEmail - User email for personalization
   * @returns Created agent object
   */
  async provisionDefaultAgent(userId: string, userEmail?: string): Promise<VoiceAgent> {
    const template = generateDefaultAgentForUser(userId, userEmail);
    
    const agent: VoiceAgent = {
      id: uuidv4(),
      userId,
      businessProfile: {
        companyName: template.businessProfile.companyName,
        industry: template.businessProfile.industry,
        website: '',
        location: {
          country: 'CH',
          city: template.businessProfile.city,
        },
        contact: {
          phone: '',
          email: userEmail || '',
        },
        openingHours: {
          monday: '09:00-17:00',
          tuesday: '09:00-17:00',
          wednesday: '09:00-17:00',
          thursday: '09:00-17:00',
          friday: '09:00-17:00',
        },
      },
      config: {
        primaryLocale: template.config.language,
        fallbackLocales: ['de-DE', 'en-US'],
        systemPrompt: template.config.systemPrompt,
        recordingConsent: template.config.recordingConsent,
        elevenLabs: {
          voiceId: template.config.elevenLabs.voiceId,
          modelId: template.config.elevenLabs.modelId,
        },
      },
      status: 'draft',
      metadata: {
        isDefaultAgent: true,
        createdFrom: 'auto-provision',
        userId,
        userEmail,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    db.saveAgent(agent); // Keep mock store for dev/demo flows

    // Persist to database when available
    await this.persistAgent(agent);

    console.log(`[DefaultAgentService] ✅ Created default agent for user ${userId}: ${agent.id}`);

    return agent;
  }

  /**
   * Check if user already has a default agent
   * @param userId - User ID to check
   * @returns True if default agent exists
   */
  async hasDefaultAgent(userId: string): Promise<boolean> {
    if (getPool()) {
      const rows = await query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM agents
           WHERE metadata ->> 'isDefaultAgent' = 'true'
             AND metadata ->> 'userId' = $1
           LIMIT 1
         ) as exists`,
        [userId]
      );

      if (rows?.[0]?.exists) {
        return true;
      }
    }

    const agents = db.getAllAgents();
    return agents.some(agent => 
      (agent as any).userId === userId || 
      (agent as any).metadata?.isDefaultAgent
    );
  }
}

export const defaultAgentService = new DefaultAgentService();
