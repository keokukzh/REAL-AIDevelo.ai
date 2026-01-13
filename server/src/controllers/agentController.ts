import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db';
import { generateSystemPrompt } from '../services/promptService';
import { defaultAgentService } from '../services/defaultAgentService';
import { VoiceAgent } from '../models/types';
import { NotFoundError, InternalServerError } from '../utils/errors';

// Plan-based phone number limits
const PHONE_NUMBER_LIMITS: Record<string, number> = {
  starter: 1,
  business: 2,
  premium: 3,
  enterprise: 5, // Default for enterprise
};

// Safe logging helper - never throws, only logs in development
const safeLogAgent = (message: string, data: any) => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`[AgentController] ${message}`, data);
    } catch (e) {
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
  } catch (error) {
    next(error);
  }
};

export const getAgents = (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = db.getAllAgents();
    res.json({ success: true, data: agents });
  } catch (error) {
    next(new InternalServerError('Failed to retrieve agents'));
  }
};

export const getAgentById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = db.getAgent(req.params.id);
    if (!agent) {
      return next(new NotFoundError('Agent'));
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    next(new InternalServerError('Failed to retrieve agent'));
  }
};

export const activateAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.params.id;
    const { phoneNumberId } = req.body; // Optional: specific phone number to activate
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
  } catch (error) {
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
    } catch (error) {
      next(error);
    }
  } catch (error) {
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

    const client = require('twilio')(accountSid, authToken);

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
  } catch (error: any) {
    console.error('[AgentController] Failed to initiate call:', error);
    next(new InternalServerError(`Failed to initiate call: ${error.message}`));
  }
};
