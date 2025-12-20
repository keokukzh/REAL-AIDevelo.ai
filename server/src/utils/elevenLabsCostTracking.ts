/**
 * ElevenLabs Cost Tracking Utility
 * 
 * Extracts and tracks character costs from ElevenLabs API response headers
 * according to the official API reference:
 * https://elevenlabs.io/docs/api-reference
 * 
 * Response headers include:
 * - x-character-count: Number of characters used in the generation
 * - request-id: Unique identifier for the request
 */

import { AxiosResponse } from 'axios';
import { logger } from './logger';

export interface ElevenLabsCostMetadata {
  characterCount: number | null;
  requestId: string | null;
  endpoint: string;
  timestamp: Date;
}

/**
 * Extract character cost metadata from ElevenLabs API response headers
 * 
 * @param response - Axios response object from ElevenLabs API call
 * @param endpoint - Endpoint name for logging (e.g., 'text-to-speech', 'register-call')
 * @returns Cost metadata object
 */
export function extractElevenLabsCosts(
  response: AxiosResponse,
  endpoint: string
): ElevenLabsCostMetadata {
  const headers = response.headers;
  
  // Extract x-character-count header (may be string or number)
  const characterCountHeader = headers['x-character-count'] || headers['X-Character-Count'];
  const characterCount = characterCountHeader 
    ? parseInt(String(characterCountHeader), 10) 
    : null;
  
  // Extract request-id header
  const requestId = headers['request-id'] || headers['Request-Id'] || null;
  
  const metadata: ElevenLabsCostMetadata = {
    characterCount: isNaN(characterCount || 0) ? null : characterCount,
    requestId: requestId ? String(requestId) : null,
    endpoint,
    timestamp: new Date(),
  };
  
  // Log cost information for tracking
  if (metadata.characterCount !== null) {
    logger.info('elevenlabs.cost_tracked', {
      endpoint,
      characterCount: metadata.characterCount,
      requestId: metadata.requestId || undefined,
      timestamp: metadata.timestamp.toISOString(),
    });
  } else if (process.env.NODE_ENV !== 'production') {
    // Warn in development if cost tracking is missing
    logger.warn('elevenlabs.cost_tracking_missing', {
      endpoint,
      requestId: metadata.requestId || undefined,
      message: 'x-character-count header not found in response',
    });
  }
  
  return metadata;
}

/**
 * Track character costs for multiple requests and aggregate
 */
export class ElevenLabsCostTracker {
  private costs: ElevenLabsCostMetadata[] = [];
  
  /**
   * Add a cost entry from an API response
   */
  track(response: AxiosResponse, endpoint: string): void {
    const metadata = extractElevenLabsCosts(response, endpoint);
    this.costs.push(metadata);
  }
  
  /**
   * Get total character count across all tracked requests
   */
  getTotalCharacterCount(): number {
    return this.costs.reduce((sum, cost) => {
      return sum + (cost.characterCount || 0);
    }, 0);
  }
  
  /**
   * Get all tracked costs
   */
  getAllCosts(): ElevenLabsCostMetadata[] {
    return [...this.costs];
  }
  
  /**
   * Clear all tracked costs
   */
  clear(): void {
    this.costs = [];
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): {
    totalRequests: number;
    totalCharacters: number;
    requestsWithCosts: number;
    averageCharactersPerRequest: number;
  } {
    const requestsWithCosts = this.costs.filter(c => c.characterCount !== null).length;
    const totalCharacters = this.getTotalCharacterCount();
    
    return {
      totalRequests: this.costs.length,
      totalCharacters,
      requestsWithCosts,
      averageCharactersPerRequest: requestsWithCosts > 0 
        ? Math.round(totalCharacters / requestsWithCosts) 
        : 0,
    };
  }
}
