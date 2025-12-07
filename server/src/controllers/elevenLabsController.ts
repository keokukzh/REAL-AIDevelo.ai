import { Request, Response, NextFunction } from 'express';
import { elevenLabsService } from '../services/elevenLabsService';

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
