import { Request, Response, NextFunction } from 'express';
import { BadRequestError, InternalServerError } from '../utils/errors';
import multer from 'multer';
import { AzureTTS } from '../services/AzureTTS';
import path from 'path';
import fs from 'fs/promises';

const azureTts = new AzureTTS();

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
        // Voice cloning is currently disabled
        res
          .status(501)
          .json({ success: false, error: 'Voice cloning is currently not available.' });
      } catch {
        next(new InternalServerError('Voice synthesis failed'));
      }
    });
  } catch {
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

    // const voiceClone = await elevenLabsService.getVoiceClone(voiceId);
    res.status(501).json({ success: false, error: 'Voice cloning is currently not available.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview a voice using text
 */
export const previewVoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voiceId } = req.body;

    if (!text || !voiceId) {
      return next(new BadRequestError('Text and voiceId are required'));
    }

    // Synthesize using Azure TTS
    const audioContent = await azureTts.synthesize(text, voiceId);

    // Save to temp file to serve
    const tmpDir = process.env.TMP_DIR || './public/audio/tmp';
    await fs.mkdir(tmpDir, { recursive: true });

    const filename = `preview_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
    const filepath = path.join(tmpDir, filename);

    await fs.writeFile(filepath, audioContent);

    const audioUrl = `/audio/tmp/${filename}`;

    res.json({
      success: true,
      audioUrl: audioUrl,
    });
  } catch (error) {
    next(error);
  }
};
