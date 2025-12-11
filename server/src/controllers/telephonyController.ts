import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db';
import { telephonyService } from '../services/telephonyService';
import { BadRequestError, NotFoundError, InternalServerError } from '../utils/errors';

/**
 * Get available phone numbers for a plan
 */
export const getAvailableNumbers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country = 'CH', planId } = req.query;

    const available = await telephonyService.listAvailableNumbers(country as string, planId as string | undefined);

    res.json({
      success: true,
      data: available,
    });
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
      const { phoneNumber, telephony } = await telephonyService.assignNumber(agentId, phoneNumberId);

      const updatedAgent = db.getAgent(agentId);

      res.json({
        success: true,
        data: {
          agentId,
          telephony: updatedAgent?.telephony || telephony,
          phoneNumber,
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
 * Assign phone number using body payload (no path param)
 */
export const assignNumberFromBody = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, phoneNumberId } = req.body;

    if (!agentId || !phoneNumberId) {
      return next(new BadRequestError('agentId and phoneNumberId are required'));
    }

    const { phoneNumber, telephony } = await telephonyService.assignNumber(agentId, phoneNumberId);
    const updatedAgent = db.getAgent(agentId);

    res.json({
      success: true,
      data: {
        agentId,
        telephony: updatedAgent?.telephony || telephony,
        phoneNumber,
      },
    });
  } catch (error) {
    next(error);
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

    await telephonyService.updateNumberSettings(phoneNumberId, {
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
    next(new InternalServerError('Failed to update phone number settings'));
  }
};

/**
 * Get phone number status
 */
export const getNumberStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumberId } = req.params;

    const status = await telephonyService.getNumberStatus(phoneNumberId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(new InternalServerError('Failed to get phone number status'));
  }
};

/**
 * Activate an assigned phone number for an agent
 */
export const activateNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    if (!agentId) {
      return next(new BadRequestError('agentId is required'));
    }

    const phoneNumber = await telephonyService.activateNumber(agentId);
    res.json({ success: true, data: { agentId, phoneNumber } });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate an assigned phone number for an agent
 */
export const deactivateNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    if (!agentId) {
      return next(new BadRequestError('agentId is required'));
    }

    const phoneNumber = await telephonyService.deactivateNumber(agentId);
    res.json({ success: true, data: { agentId, phoneNumber } });
  } catch (error) {
    next(error);
  }
};

/**
 * Provider webhook handler (status updates, inbound events)
 */
export const handleProviderWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: verify signature using provider secret before trusting payload
    const event = req.body;
    console.log('[Telephony webhook] event received', event?.type || 'unknown');
    res.status(200).json({ success: true });
  } catch (error) {
    next(new InternalServerError('Failed to process telephony webhook'));
  }
};

