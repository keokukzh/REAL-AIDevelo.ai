import { Request, Response, NextFunction } from 'express';
import { elevenLabsService } from '../services/elevenLabsService';
import { db } from '../services/db';
import { BadRequestError, NotFoundError, InternalServerError } from '../utils/errors';

/**
 * Get available phone numbers for a plan
 */
export const getAvailableNumbers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country = 'CH', planId } = req.query;

    try {
      const phoneNumbers = await elevenLabsService.getAvailablePhoneNumbers(country as string);

      // Filter by plan if needed (Starter: 1, Business: 2, Premium: 3)
      let maxNumbers = 1;
      if (planId === 'business') maxNumbers = 2;
      if (planId === 'premium') maxNumbers = 3;

      const available = phoneNumbers
        .filter(pn => pn.status === 'available')
        .slice(0, maxNumbers);

      res.json({
        success: true,
        data: available,
      });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(new InternalServerError('Failed to get available phone numbers'));
  }
};

/**
 * Assign phone number to agent
 */
export const assignNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { phoneNumberId } = req.body;

    if (!agentId) {
      return next(new BadRequestError('agentId is required'));
    }

    // Verify agent exists
    const agent = db.getAgent(agentId);
    if (!agent) {
      return next(new NotFoundError('Agent'));
    }

    try {
      // Assign phone number via ElevenLabs
      const phoneNumber = await elevenLabsService.assignPhoneNumber(agentId, phoneNumberId);

      // Update agent with telephony info
      if (!agent.telephony) {
        agent.telephony = {
          phoneNumber: phoneNumber.number,
          phoneNumberId: phoneNumber.id,
          status: 'assigned',
          assignedAt: new Date(),
        };
      } else {
        agent.telephony.phoneNumber = phoneNumber.number;
        agent.telephony.phoneNumberId = phoneNumber.id;
        agent.telephony.status = 'assigned';
        agent.telephony.assignedAt = new Date();
      }
      
      agent.updatedAt = new Date();
      db.saveAgent(agent);

      res.json({
        success: true,
        data: {
          agentId,
          telephony: agent.telephony,
        },
      });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(new InternalServerError('Failed to assign phone number'));
  }
};

/**
 * Update phone number settings
 */
export const updateNumberSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumberId } = req.params;
    const { agentId, greetingMessage, voicemailEnabled, callRecordingEnabled } = req.body;

    if (!agentId) {
      return next(new BadRequestError('agentId is required'));
    }

    try {
      await elevenLabsService.updatePhoneNumberSettings(phoneNumberId, {
        agentId,
        greetingMessage,
        voicemailEnabled,
        callRecordingEnabled,
      });

      res.json({
        success: true,
        message: 'Phone number settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(new InternalServerError('Failed to update phone number settings'));
  }
};

/**
 * Get phone number status
 */
export const getNumberStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumberId } = req.params;

    try {
      const status = await elevenLabsService.getPhoneNumberStatus(phoneNumberId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(new InternalServerError('Failed to get phone number status'));
  }
};

