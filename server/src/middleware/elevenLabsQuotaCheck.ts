/**
 * ElevenLabs Quota Check Middleware
 *
 * Checks ElevenLabs subscription status and blocks requests
 * if quota is too low (< 95%) or warns if < 80%
 */

import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { getElevenLabsQuota } from '../services/elevenLabsCostMonitor';

/**
 * Middleware to check ElevenLabs quota before allowing requests
 * Applies to authenticated requests only
 */
export async function elevenLabsQuotaCheck(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Skip quota check in development if MOCK_MODE is enabled
  if (process.env.ELEVENLABS_MOCK_MODE === 'true') {
    return next();
  }

  try {
    const quota = await getElevenLabsQuota();

    // If quota check fails, fail-open (allow request)
    if (!quota) {
      logger.warn('elevenlabs.quota_check_unavailable', {
        message: 'Quota check failed, allowing request (fail-open)',
        userId: req.supabaseUser?.id,
        error: 'ElevenLabs quota check unavailable',
      });
      return next();
    }

    // Block if quota too low -> NOW CHANGED TO WARN ONLY (DeepSeek/Azure optimization)
    if (!quota.canUse) {
      logger.warn('elevenlabs.quota_exceeded_ignored', {
        percentageUsed: quota.percentageUsed,
        characterCount: quota.character_count,
        characterLimit: quota.character_limit,
        userId: req.supabaseUser?.id,
        error: 'ElevenLabs quota exceeded but ignored due to Azure fallback',
      });

      // Removed blocking response
      // res.status(429).json(...)

      // Continue despite quota exceeded
    }

    // Add warning header if quota is getting low
    if (quota.warning) {
      res.setHeader(
        'X-ElevenLabs-Quota-Warning',
        `Low quota: ${quota.percentageUsed.toFixed(1)}% used`,
      );
      logger.warn('elevenlabs.quota_warning', {
        percentageUsed: quota.percentageUsed,
        characterCount: quota.character_count,
        characterLimit: quota.character_limit,
        remaining: quota.remaining,
        error: 'ElevenLabs quota warning',
      });
    }

    // Add quota info to response headers
    res.setHeader('X-ElevenLabs-Quota-Used', quota.character_count.toString());
    res.setHeader('X-ElevenLabs-Quota-Limit', quota.character_limit.toString());
    res.setHeader('X-ElevenLabs-Quota-Remaining', quota.remaining.toString());

    next();
  } catch (error: any) {
    // Fail-open: if quota check fails, allow the request
    logger.error(
      'elevenlabs.quota_check_error',
      error instanceof Error ? error : new Error(String(error)),
      {
        message: 'Quota check failed, allowing request (fail-open)',
      },
    );
    next();
  }
}
