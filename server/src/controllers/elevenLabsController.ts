import { Request, Response, NextFunction } from 'express';
import { elevenLabsService } from '../services/elevenLabsService';
import { BadRequestError, InternalServerError } from '../utils/errors';
import axios from 'axios';
import { config } from '../config/env';

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

export const testConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const API_BASE = 'https://api.elevenlabs.io/v1';
    const results: any = {
      apiKeyConfigured: config.isElevenLabsConfigured,
      tests: [],
    };

    if (!config.isElevenLabsConfigured) {
      return res.json({
        success: false,
        data: {
          ...results,
          error: 'ELEVENLABS_API_KEY not configured. Please set it in your .env file.',
        },
      });
    }

    // Test 1: Validate API Key (GET /user)
    try {
      const userResponse = await axios.get(`${API_BASE}/user`, {
        headers: { 'xi-api-key': config.elevenLabsApiKey },
        timeout: 10000,
      });
      results.tests.push({
        name: 'API Key Validation',
        status: 'passed',
        details: {
          subscription: userResponse.data.subscription?.tier || 'Unknown',
          charactersUsed: userResponse.data.subscription?.character_count || 0,
          charactersLimit: userResponse.data.subscription?.character_limit || 0,
        },
      });
      results.apiKeyValid = true;
      results.subscription = userResponse.data.subscription;
    } catch (error) {
      results.tests.push({
        name: 'API Key Validation',
        status: 'failed',
        error: axios.isAxiosError(error) 
          ? `${error.response?.status}: ${error.response?.statusText || error.message}`
          : 'Unknown error',
      });
      results.apiKeyValid = false;
    }

    // Test 2: Get Voices
    try {
      const voices = await elevenLabsService.getVoices('de');
      results.tests.push({
        name: 'Fetch Voices',
        status: 'passed',
        details: {
          voicesCount: voices.length,
          sampleVoices: voices.slice(0, 3).map((v: any) => ({ name: v.name, id: v.voice_id })),
        },
      });
      results.voicesCount = voices.length;
    } catch (error) {
      results.tests.push({
        name: 'Fetch Voices',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 3: TTS Generation
    try {
      const testText = 'Hallo, dies ist ein Test der ElevenLabs Verbindung.';
      const audioBuffer = await elevenLabsService.generateSpeech(testText);
      results.tests.push({
        name: 'Text-to-Speech Generation',
        status: 'passed',
        details: {
          audioSizeKB: (audioBuffer.length / 1024).toFixed(2),
          textLength: testText.length,
        },
      });
      results.ttsTest = { success: true, audioSize: audioBuffer.length };
    } catch (error) {
      results.tests.push({
        name: 'Text-to-Speech Generation',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      results.ttsTest = { success: false };
    }

    const allTestsPassed = results.tests.every((test: any) => test.status === 'passed');

    res.json({
      success: allTestsPassed,
      data: results,
    });
  } catch (error) {
    next(new InternalServerError('Failed to test ElevenLabs connection'));
  }
};
