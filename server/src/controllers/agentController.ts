import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db';
import { elevenLabsService } from '../services/elevenLabsService';
import { generateSystemPrompt } from '../services/promptService';
import { VoiceAgent, BusinessProfile } from '../models/types';

export const createAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessProfile, config } = req.body;
    
    // 1. Generate System Prompt based on profile
    const systemPrompt = generateSystemPrompt(businessProfile);
    
    // 2. Enhance config with generated prompt (if not provided specifically)
    const finalConfig = {
      ...config,
      systemPrompt: config.systemPrompt || systemPrompt
    };

    // 3. Create Agent in ElevenLabs
    const elevenLabsAgentId = await elevenLabsService.createAgent(
      `${businessProfile.companyName} - Assistant`,
      finalConfig
    );

    // 4. Save to internal DB
    const newAgent: VoiceAgent = {
      id: uuidv4(),
      elevenLabsAgentId,
      businessProfile,
      config: finalConfig,
      status: 'production_ready', // Assuming 'created' means ready for test/use
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    db.saveAgent(newAgent);

    res.status(201).json({
      success: true,
      data: newAgent
    });

  } catch (error) {
    next(error);
  }
};

export const getAgents = (req: Request, res: Response) => {
    const agents = db.getAllAgents();
    res.json({ success: true, data: agents });
};

export const getAgentById = (req: Request, res: Response) => {
    const agent = db.getAgent(req.params.id);
    if (!agent) {
        return res.status(404).json({ success: false, error: "Agent not found" });
    }
    res.json({ success: true, data: agent });
};
