import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db';
import { elevenLabsService } from '../services/elevenLabsService';
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

export const createAgent = async (req: Request, res: Response, next: NextFunction) => {
  // #region agent log
  const fs = require('fs');
  // #endregion
  
  try {
    const { businessProfile, config, subscription, voiceCloning, purchaseId } = req.body;
    
    console.log('[AgentController] createAgent called', {
      hasBusinessProfile: !!businessProfile,
      hasConfig: !!config,
      companyName: businessProfile?.companyName,
      path: req.path,
      method: req.method,
      origin: req.headers.origin
    });
    
    // #region agent log
    try {
      fs.appendFileSync('c:\\Users\\Aidevelo\\Desktop\\REAL-AIDevelo.ai\\.cursor\\debug.log', JSON.stringify({location:'agentController.ts:20',message:'createAgent controller entry',data:{hasBusinessProfile:!!businessProfile,hasConfig:!!config,companyName:businessProfile?.companyName,subscriptionPlanId:subscription?.planId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'}) + '\n');
    } catch (e) {
      // Ignore file write errors (Railway is Linux)
    }
    // #endregion
    
    // 1. Generate System Prompt based on profile and recording consent
    const systemPrompt = generateSystemPrompt(businessProfile, { recordingConsent: config.recordingConsent });
    
    // 2. Enhance config with generated prompt (if not provided specifically)
    const finalConfig = {
      ...config,
      systemPrompt: config.systemPrompt || systemPrompt
    };

    // 3. Handle Voice Cloning if provided
    let voiceId = config.elevenLabs.voiceId;
    if (voiceCloning?.voiceId) {
      voiceId = voiceCloning.voiceId;
      finalConfig.elevenLabs.voiceId = voiceId;
    }

    // 4. Create initial agent record with status 'creating' (async job will complete it)
    const newAgent: VoiceAgent = {
      id: uuidv4(),
      elevenLabsAgentId: '', // Will be populated async
      businessProfile,
      config: finalConfig,
      subscription: subscription ? {
        planId: subscription.planId,
        planName: subscription.planName,
        purchaseId: subscription.purchaseId || purchaseId || '',
        purchasedAt: subscription.purchasedAt ? new Date(subscription.purchasedAt) : new Date(),
        status: 'active',
      } : undefined,
      voiceCloning: voiceCloning?.voiceId ? {
        voiceId: voiceCloning.voiceId,
        voiceName: voiceCloning.voiceName,
        audioUrl: voiceCloning.audioUrl,
        createdAt: voiceCloning.createdAt ? new Date(voiceCloning.createdAt) : new Date(),
      } : undefined,
      status: 'creating', // Status indicating async job in progress
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // #region agent log
    try {
      fs.appendFileSync('c:\\Users\\Aidevelo\\Desktop\\REAL-AIDevelo.ai\\.cursor\\debug.log', JSON.stringify({location:'agentController.ts:62',message:'Before DB saveAgent',data:{agentId:newAgent.id,status:newAgent.status,companyName:newAgent.businessProfile.companyName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'}) + '\n');
    } catch (e) {}
    // #endregion
    
    db.saveAgent(newAgent);

    // #region agent log
    fs.appendFileSync('c:\\Users\\Aidevelo\\Desktop\\REAL-AIDevelo.ai\\.cursor\\debug.log', JSON.stringify({location:'agentController.ts:68',message:'After DB saveAgent',data:{agentId:newAgent.id,status:newAgent.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'}) + '\n');
    // #endregion

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

    // 6. Return immediately with status 'creating' - async job will complete creation
    // #region agent log
    fs.appendFileSync('c:\\Users\\Aidevelo\\Desktop\\REAL-AIDevelo.ai\\.cursor\\debug.log', JSON.stringify({location:'agentController.ts:87',message:'Sending response to client',data:{agentId:newAgent.id,status:newAgent.status,hasElevenLabsId:!!newAgent.elevenLabsAgentId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'}) + '\n');
    // #endregion
    
    res.status(201).json({
      success: true,
      data: newAgent
    });

    // 7. Run ElevenLabs agent creation asynchronously (don't block request)
    setImmediate(async () => {
      try {
        // #region agent log
        fs.appendFileSync('c:\\Users\\Aidevelo\\Desktop\\REAL-AIDevelo.ai\\.cursor\\debug.log', JSON.stringify({location:'agentController.ts:96',message:'Before ElevenLabs API call',data:{agentId:newAgent.id,companyName:businessProfile.companyName,voiceId:finalConfig.elevenLabs.voiceId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'}) + '\n');
        // #endregion
        
        const elevenLabsAgentId = await elevenLabsService.createAgent(
          `${businessProfile.companyName} - Assistant`,
          finalConfig
        );
        
        // #region agent log
        fs.appendFileSync('c:\\Users\\Aidevelo\\Desktop\\REAL-AIDevelo.ai\\.cursor\\debug.log', JSON.stringify({location:'agentController.ts:106',message:'After ElevenLabs API call',data:{agentId:newAgent.id,elevenLabsAgentId:elevenLabsAgentId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'}) + '\n');
        // #endregion

        // Update agent with elevenLabsAgentId and setup phone numbers
        newAgent.elevenLabsAgentId = elevenLabsAgentId;

        // 8. Assign phone number(s) based on plan
        if (subscription?.planId) {
          const phoneNumberLimit = PHONE_NUMBER_LIMITS[subscription.planId] || 1;
          try {
            const availableNumbers = await elevenLabsService.getAvailablePhoneNumbers('CH');
            const numbersToAssign = availableNumbers
              .filter(pn => pn.status === 'available')
              .slice(0, phoneNumberLimit);

            if (numbersToAssign.length > 0) {
              const assignedNumber = await elevenLabsService.assignPhoneNumber(elevenLabsAgentId, numbersToAssign[0].id);
              newAgent.telephony = {
                phoneNumber: assignedNumber.number,
                phoneNumberId: assignedNumber.id,
                status: 'assigned' as const,
                assignedAt: new Date(),
              };
            }
          } catch (error) {
            console.warn('[AgentController] Failed to assign phone number:', error);
          }
        }

        // Update status to pending_activation
        newAgent.status = 'pending_activation';
        newAgent.updatedAt = new Date();
        db.saveAgent(newAgent);

        console.log('[AgentController] Agent creation completed asynchronously:', newAgent.id);
      } catch (error) {
        // Mark agent as failed and log error
        newAgent.status = 'creation_failed';
        newAgent.updatedAt = new Date();
        db.saveAgent(newAgent);
        console.error('[AgentController] Async agent creation failed:', error);
      }
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
        data: { ...agent, message: 'Agent is already active' }
      });
    }

    if (!agent.elevenLabsAgentId) {
      return next(new InternalServerError('Agent has no ElevenLabs ID'));
    }

    // 1. Activate phone number if assigned
    if (agent.telephony?.phoneNumberId) {
      try {
        const targetPhoneNumberId = phoneNumberId || agent.telephony.phoneNumberId;
        
        // Update phone number settings to activate
        await elevenLabsService.updatePhoneNumberSettings(targetPhoneNumberId, {
          agentId: agent.elevenLabsAgentId,
          callRecordingEnabled: agent.config.recordingConsent || false,
        });

        // Update telephony status
        agent.telephony.status = 'active';
        agent.telephony.assignedAt = new Date();
      } catch (error) {
        console.error('[AgentController] Failed to activate phone number:', error);
        // Continue with activation even if phone number activation fails
      }
    }

    // 2. Update ElevenLabs agent status (if API supports it)
    // Note: ElevenLabs might not have explicit "live" status, but we can verify agent exists
    try {
      await elevenLabsService.getAgentStatus(agent.elevenLabsAgentId);
    } catch (error) {
      console.warn('[AgentController] Failed to verify ElevenLabs agent status:', error);
    }

    // 3. Update agent status
    agent.status = 'active';
    agent.updatedAt = new Date();
    db.saveAgent(agent);

    // 4. After a short delay, mark as "live" (fully operational)
    setTimeout(() => {
      const updatedAgent = db.getAgent(agentId);
      if (updatedAgent && updatedAgent.status === 'active') {
        updatedAgent.status = 'live';
        updatedAgent.updatedAt = new Date();
        db.saveAgent(updatedAgent);
      }
    }, 5000); // 5 second delay to ensure everything is ready

    res.json({
      success: true,
      data: agent,
      message: 'Agent successfully activated. Status will update to "live" shortly.'
    });
  } catch (error) {
    next(new InternalServerError('Failed to activate agent'));
  }
};

/**
 * Sync agent with ElevenLabs
 */
export const syncAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.params.id;
    const agent = db.getAgent(agentId);
    
    if (!agent) {
      return next(new NotFoundError('Agent'));
    }

    if (!agent.elevenLabsAgentId) {
      return next(new InternalServerError('Agent has no ElevenLabs ID'));
    }

    try {
      // Get latest status from ElevenLabs
      const elevenLabsStatus = await elevenLabsService.getAgentStatus(agent.elevenLabsAgentId);

      // Update phone number status if assigned
      if (agent.telephony?.phoneNumberId) {
        try {
          const phoneStatus = await elevenLabsService.getPhoneNumberStatus(agent.telephony.phoneNumberId);
          if (agent.telephony) {
            agent.telephony.status = phoneStatus.status as any;
          }
        } catch (error) {
          console.warn('[AgentController] Failed to sync phone number status:', error);
        }
      }

      // Update agent
      agent.updatedAt = new Date();
      db.saveAgent(agent);

      res.json({
        success: true,
        data: {
          agent,
          elevenLabsStatus,
        },
        message: 'Agent synchronized successfully'
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
        error: 'userId is required'
      });
    }

    // Check if user already has a default agent
    if (await defaultAgentService.hasDefaultAgent(userId)) {
      return res.status(409).json({
        success: false,
        error: 'Default agent already exists for this user'
      });
    }

    // Provision default agent
    const agent = await defaultAgentService.provisionDefaultAgent(userId, userEmail);

    res.status(201).json({
      success: true,
      data: agent,
      message: 'Default agent created successfully. You can now customize it in the dashboard.'
    });
  } catch (error) {
    console.error('[AgentController] Failed to create default agent:', error);
    next(new InternalServerError('Failed to create default agent'));
  }
};
