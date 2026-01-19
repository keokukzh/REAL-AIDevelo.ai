import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db';
import { generateSystemPrompt } from '../services/promptService';
import { defaultAgentService } from '../services/defaultAgentService';
import { VoiceAgent } from '../models/types';
import { NotFoundError, InternalServerError } from '../utils/errors';
import { AgentService } from '../services/agentService';
import { supabaseAdmin } from '../services/supabaseDb';

// Plan-based phone number limits (used in subscription logic)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PHONE_NUMBER_LIMITS: Record<string, number> = {
  starter: 1,
  business: 2,
  premium: 3,
  enterprise: 5, // Default for enterprise
};

// Safe logging helper - never throws, only logs in development
const safeLogAgent = (message: string, data: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`[AgentController] ${message}`, data);
    } catch {
      // Ignore logging errors - never crash on logging
    }
  }
};

export const createAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessProfile, config, subscription, voiceCloning, purchaseId } = req.body;

    console.log('[AgentController] createAgent called', {
      hasBusinessProfile: !!businessProfile,
      hasConfig: !!config,
      companyName: businessProfile?.companyName,
      path: req.path,
      method: req.method,
      origin: req.headers.origin,
    });

    safeLogAgent('createAgent controller entry', {
      hasBusinessProfile: !!businessProfile,
      hasConfig: !!config,
      companyName: businessProfile?.companyName,
      subscriptionPlanId: subscription?.planId,
    });

    // 1. Generate System Prompt based on profile and recording consent
    const recordingConsent = config.recordingConsent ?? false;
    const systemPrompt = generateSystemPrompt(businessProfile, { recordingConsent });

    // 2. Enhance config with generated prompt (if not provided specifically)
    const finalConfig = {
      ...config,
      systemPrompt: config.systemPrompt || systemPrompt,
    };

    // 3. Handle Voice Settings if provided
    let voiceId = config.voiceSettings?.voiceId || '';
    if (voiceCloning?.voiceId) {
      voiceId = voiceCloning.voiceId;
      if (!finalConfig.voiceSettings) finalConfig.voiceSettings = { voiceId: '', modelId: '' };
      finalConfig.voiceSettings.voiceId = voiceId;
    }

    // 4. Create agent record
    const newAgent: VoiceAgent = {
      id: uuidv4(),
      businessProfile,
      config: finalConfig,
      subscription: subscription
        ? {
            planId: subscription.planId,
            planName: subscription.planName,
            purchaseId: subscription.purchaseId || purchaseId || '',
            purchasedAt: subscription.purchasedAt ? new Date(subscription.purchasedAt) : new Date(),
            status: 'active',
          }
        : undefined,
      voiceCloning: voiceCloning?.voiceId
        ? {
            voiceId: voiceCloning.voiceId,
            voiceName: voiceCloning.voiceName,
            audioUrl: voiceCloning.audioUrl,
            createdAt: voiceCloning.createdAt ? new Date(voiceCloning.createdAt) : new Date(),
          }
        : undefined,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    safeLogAgent('Before DB saveAgent', {
      agentId: newAgent.id,
      status: newAgent.status,
      companyName: newAgent.businessProfile.companyName,
    });

    db.saveAgent(newAgent);

    safeLogAgent('After DB saveAgent', {
      agentId: newAgent.id,
      status: newAgent.status,
    });

    // 5. Link purchase to agent if purchaseId provided
    if (purchaseId) {
      try {
        const purchase = db.getPurchaseByPurchaseId(purchaseId);
        if (purchase) {
          purchase.agentId = newAgent.id;
          db.savePurchase(purchase);
        }
      } catch (error) {
        console.warn('[AgentController] Failed to link purchase:', error);
      }
    }

    // 6. Return immediately
    safeLogAgent('Sending response to client', {
      agentId: newAgent.id,
      status: newAgent.status,
    });

    res.status(201).json({
      success: true,
      data: newAgent,
    });
  } catch (err: unknown) {
    next(err);
  }
};

export const getAgents = (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = db.getAllAgents();
    res.json({ success: true, data: agents });
  } catch {
    next(new InternalServerError('Failed to retrieve agents'));
  }
};

/**
 * Helper: Map Supabase agent data to the legacy VoiceAgent model
 * This ensures compatibility with the existing AgentEditPage frontend
 */
interface SupabaseAgentConfig {
  id: string;
  setup_state: string;
  eleven_agent_id?: string;
  greeting_template?: string;
  company_name?: string;
  locations?: {
    id: string;
    name: string;
    organizations?: {
      id: string;
      name: string;
      users?: { email: string }[];
    };
  };
  created_at: string;
  updated_at: string;
  business_type?: string;
  primary_locale?: string;
  recording_consent?: boolean;
}

const mapSupabaseToVoiceAgent = (supabaseData: SupabaseAgentConfig): VoiceAgent => {
  const {
    id,
    setup_state,
    eleven_agent_id,
    greeting_template,
    company_name,
    locations,
    created_at,
    updated_at,
    business_type,
  } = supabaseData;

  const location = locations;
  const org = location?.organizations;

  // Find a suitable voice from locations or defaults
  // In a real scenario, this might be stored in a separate column or JSON
  const voiceId = eleven_agent_id || 'de-CH-LeniNeural';

  return {
    id,
    businessProfile: {
      companyName: company_name || location?.name || org?.name || 'Mein Unternehmen',
      industry: business_type || 'general',
      website: '',
      location: {
        country: 'CH',
        city: location?.name || '',
      },
      contact: {
        phone: '',
        email: org?.users?.[0]?.email || '',
      },
      openingHours: {},
    },
    config: {
      primaryLocale: supabaseData.primary_locale || 'de-CH',
      fallbackLocales: [],
      recordingConsent: supabaseData.recording_consent ?? true,
      systemPrompt: greeting_template || '',
      voiceSettings: {
        voiceId: voiceId,
        modelId: 'eleven_turbo_v2_5',
      },
    },
    status: setup_state === 'ready' ? 'active' : 'inactive',
    createdAt: new Date(created_at),
    updatedAt: new Date(updated_at || created_at),
  };
};

export const getAgentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 1. Try legacy DB first
    const legacyAgent = db.getAgent(id);
    if (legacyAgent) {
      return res.json({ success: true, data: legacyAgent });
    }

    // 2. Fallback to Supabase if ID looks like a UUID or legacy not found
    try {
      const supabaseAgentData = await AgentService.getAgentConfigWithLocation(id);
      if (supabaseAgentData) {
        const mappedAgent = mapSupabaseToVoiceAgent(supabaseAgentData);
        return res.json({ success: true, data: mappedAgent });
      }
    } catch {
      // If AgentService throws NotFound, we'll hit the check below
      console.warn('[AgentController] Supabase lookup failed or agent not found:', id);
    }

    return next(new NotFoundError('Agent'));
  } catch (error) {
    console.error('[AgentController] getAgentById error:', error);
    next(new InternalServerError('Failed to retrieve agent'));
  }
};

export const activateAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.params.id;
    const agent = db.getAgent(agentId);

    if (!agent) {
      return next(new NotFoundError('Agent'));
    }

    if (agent.status === 'active' || agent.status === 'live') {
      return res.json({
        success: true,
        data: { ...agent, message: 'Agent is already active' },
      });
    }

    // 1. Mark status as live (since we don't have external activation anymore)
    agent.status = 'live';
    agent.updatedAt = new Date();
    db.saveAgent(agent);

    // Status is already live

    res.json({
      success: true,
      data: agent,
      message: 'Agent successfully activated. Status will update to "live" shortly.',
    });
  } catch {
    next(new InternalServerError('Failed to activate agent'));
  }
};

/**
 * Sync agent
 */
export const syncAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.params.id;
    const agent = db.getAgent(agentId);

    if (!agent) {
      return next(new NotFoundError('Agent'));
    }

    try {
      // Syncing is now just a no-op or local update
      agent.updatedAt = new Date();
      db.saveAgent(agent);

      res.json({
        success: true,
        data: { agent },
        message: 'Agent synchronized successfully',
      });
    } catch (err: unknown) {
      next(err);
    }
  } catch {
    next(new InternalServerError('Failed to sync agent'));
  }
};

/**
 * Create a default agent for a new user
 * Used during user registration to auto-provision a starter agent
 */
export const createDefaultAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userEmail } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    // Check if user already has a default agent
    if (await defaultAgentService.hasDefaultAgent(userId)) {
      return res.status(409).json({
        success: false,
        error: 'Default agent already exists for this user',
      });
    }

    // Provision default agent
    const agent = await defaultAgentService.provisionDefaultAgent(userId, userEmail);

    res.status(201).json({
      success: true,
      data: agent,
      message: 'Default agent created successfully. You can now customize it in the dashboard.',
    });
  } catch (error) {
    console.error('[AgentController] Failed to create default agent:', error);
    next(new InternalServerError('Failed to create default agent'));
  }
};

/**
 * Initiate an outbound call from the agent
 */
export const initiateCall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to } = req.body;
    const agentId = req.params.id;

    if (!to) {
      return res
        .status(400)
        .json({ success: false, error: 'Target phone number (to) is required' });
    }

    // Verify agent exists
    const agent = db.getAgent(agentId);
    if (!agent) {
      return next(new NotFoundError('Agent'));
    }

    // Use Twilio to initiate call
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return next(new InternalServerError('Twilio not configured'));
    }

    // Dynamic import to avoid forbidden require() and maintain ESM compatibility
    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    // We point the call to our incoming handler which connects to the stream
    const call = await client.calls.create({
      url: `https://${req.headers.host}/api/twilio/voice/incoming`,
      to,
      from: fromNumber,
    });

    res.json({
      success: true,
      data: {
        callSid: call.sid,
        status: call.status,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[AgentController] Failed to initiate call:', err);
    next(new InternalServerError(`Failed to initiate call: ${errorMessage}`));
  }
};

/**
 * Update agent - handles both legacy and Supabase agents
 */
export const updateAgent = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // 1. Try legacy DB first
    const legacyAgent = db.getAgent(id);
    if (legacyAgent) {
      const updatedAgent = db.updateAgent(id, updates);
      return res.json({ success: true, data: updatedAgent });
    }

    // 2. Use atomic Supabase function
    console.log(
      `[AgentController] Updating Supabase agent ${id} with atomic transaction`,
      JSON.stringify(updates, null, 2),
    );

    const { data: resultData, error } = await supabaseAdmin.rpc('update_agent_atomic', {
      p_agent_id: id,
      p_company_name: updates.businessProfile?.companyName,
      p_city: updates.businessProfile?.location?.city,
      p_system_prompt: updates.config?.systemPrompt,
      p_greeting_template: updates.config?.greetingTemplate,
      p_recording_consent: updates.config?.recordingConsent,
      p_voice_id: updates.config?.voiceSettings?.voiceId,
      p_primary_locale: updates.config?.primaryLocale,
    });

    if (error) {
      console.error('[AgentController] Supabase RPC failed:', error);
      throw error;
    }

    if (!resultData || resultData.length === 0) {
      return next(new NotFoundError('Agent'));
    }

    // 3. Invalidate cache AFTER successful update
    const publicUrl = process.env.PUBLIC_BASE_URL || 'https://aidevelo.ai';
    fetch(`${publicUrl}/api/agents/${id}`, { method: 'PURGE' }).catch(() => {});

    // 4. Return refreshed data using existing service method to ensure full object structure
    const fullData = await AgentService.getAgentConfigWithLocation(id);
    return res.json({ success: true, data: mapSupabaseToVoiceAgent(fullData) });
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    console.error('[AgentController] updateAgent error:', error);
    if (error.code === 'PGRST116') return next(new NotFoundError('Agent'));
    next(new InternalServerError(`Failed to update agent: ${error.message || String(err)}`));
  }
};
