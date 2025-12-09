import { Request, Response, NextFunction } from 'express';
import { elevenLabsService } from '../services/elevenLabsService';
import { BadRequestError } from '../utils/errors';

export const getVoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locale = req.query.locale as string || 'de';
    const voices = await elevenLabsService.getVoices(locale);
    res.json({
        success: true,
        data: voices
    });
  } catch (error) {
    next(error);
  }
};

export const generateSpeech = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voiceId, modelId } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return next(new BadRequestError('Text is required and must be a non-empty string'));
    }

    // Use provided voiceId or default
    const finalVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM';
    const finalModelId = modelId || 'eleven_multilingual_v2';

    // Generate speech
    const audioBuffer = await elevenLabsService.generateSpeech(text, finalVoiceId, finalModelId);

    // Convert to base64 for easy transmission
    const audioBase64 = audioBuffer.toString('base64');

    // Return both base64 and info
    res.json({
      success: true,
      data: {
        audioBase64,
        voiceId: finalVoiceId,
        modelId: finalModelId,
        textLength: text.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
