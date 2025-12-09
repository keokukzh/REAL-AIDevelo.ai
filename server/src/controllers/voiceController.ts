import { Request, Response, NextFunction } from 'express';
import { elevenLabsService } from '../services/elevenLabsService';
import { BadRequestError, InternalServerError } from '../utils/errors';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only audio files are allowed'));
    }
  },
});

/**
 * Upload voice clone audio and create voice clone
 */
export const uploadVoiceClone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadMiddleware = upload.single('audio');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      if (!req.file) {
        return next(new BadRequestError('Audio file is required'));
      }

      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return next(new BadRequestError('Voice name is required'));
      }

      try {
        // Create voice clone in ElevenLabs
        // Pass buffer directly - elevenLabsService will handle it
        const voiceId = await elevenLabsService.createVoiceClone(req.file.buffer, name, req.file.mimetype);

        res.json({
          success: true,
          data: {
            voiceId,
            name,
            audioSize: req.file.size,
            mimeType: req.file.mimetype,
          },
        });
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    next(new InternalServerError('Failed to upload voice clone'));
  }
};

/**
 * Get voice clone details
 */
export const getVoiceClone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { voiceId } = req.params;

    if (!voiceId) {
      return next(new BadRequestError('voiceId is required'));
    }

    const voiceClone = await elevenLabsService.getVoiceClone(voiceId);

    res.json({
      success: true,
      data: voiceClone,
    });
  } catch (error) {
    next(error);
  }
};

