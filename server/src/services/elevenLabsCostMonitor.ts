/**
 * ElevenLabs Cost Monitor Service
 * 
 * Monitors ElevenLabs subscription status and provides quota information
 * Uses direct API calls (works in production, not dependent on MCP)
 */

import axios from 'axios';
import { config } from '../config/env';
import { cacheService, CacheTTL } from './cacheService';
import { logger } from '../utils/logger';

interface ElevenLabsQuota {
  character_count: number;
  character_limit: number;
  percentageUsed: number;
  remaining: number;
  canUse: boolean;
  warning: boolean;
  status: 'ok' | 'warning' | 'critical';
}

const QUOTA_CACHE_KEY = 'elevenlabs:quota_status';
const QUOTA_CACHE_TTL = 300; // 5 minutes

/**
 * Get ElevenLabs subscription quota status
 * Cached for 5 minutes to avoid excessive API calls
 */
export async function getElevenLabsQuota(): Promise<ElevenLabsQuota | null> {
  // Skip if mock mode is enabled
  if (process.env.ELEVENLABS_MOCK_MODE === 'true') {
    return {
      character_count: 0,
      character_limit: 40000,
      percentageUsed: 0,
      remaining: 40000,
      canUse: true,
      warning: false,
      status: 'ok',
    };
  }

  // Check cache first
  const cached = await cacheService.get<ElevenLabsQuota>(QUOTA_CACHE_KEY);
  if (cached) {
    return cached;
  }

  // Fetch from API if not cached
  if (!config.elevenLabsApiKey || !config.isElevenLabsConfigured) {
    return null;
  }

  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': config.elevenLabsApiKey,
      },
      timeout: 5000,
    });

    const subscription = response.data;
    const characterCount = subscription.character_count || 0;
    const characterLimit = subscription.character_limit || 40000;
    const percentageUsed = (characterCount / characterLimit) * 100;
    const remaining = characterLimit - characterCount;

    const quota: ElevenLabsQuota = {
      character_count: characterCount,
      character_limit: characterLimit,
      percentageUsed,
      remaining,
      canUse: percentageUsed < 95, // Block if > 95% used
      warning: percentageUsed >= 80, // Warn if > 80% used
      status: percentageUsed >= 95 ? 'critical' : percentageUsed >= 80 ? 'warning' : 'ok',
    };

    // Cache the result
    await cacheService.set(QUOTA_CACHE_KEY, quota, QUOTA_CACHE_TTL);

    // Log warning if quota is low
    if (quota.warning) {
      logger.warn('elevenlabs.quota_warning', {
        percentageUsed: quota.percentageUsed.toFixed(1),
        remaining: quota.remaining,
        characterCount: quota.character_count,
        characterLimit: quota.character_limit,
        error: 'ElevenLabs quota warning',
      });
    }

    if (quota.status === 'critical') {
      logger.error('elevenlabs.quota_critical', new Error('ElevenLabs quota critical'), {
        percentageUsed: quota.percentageUsed.toFixed(1),
        remaining: quota.remaining,
        characterCount: quota.character_count,
        characterLimit: quota.character_limit,
      });
    }

    return quota;
  } catch (error: any) {
    logger.error('elevenlabs.quota_fetch_failed', error instanceof Error ? error : new Error(String(error)), {
      message: 'Failed to fetch ElevenLabs quota, returning null',
    });
    return null;
  }
}

/**
 * Clear quota cache (useful after quota updates)
 */
export async function clearQuotaCache(): Promise<void> {
  await cacheService.delete(QUOTA_CACHE_KEY);
}
