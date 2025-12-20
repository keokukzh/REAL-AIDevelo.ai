import { Request, Response } from 'express';
import { agentCore } from '../core/agent/agentCore';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, redact } from '../utils/logger';

/**
 * Validate origin against allowed domains
 */
function isOriginAllowed(origin: string | undefined, allowedDomains: string[]): boolean {
  if (!origin) {
    return false; // Require origin for widget requests
  }

  // Normalize origin (remove protocol, www, trailing slash)
  const normalizedOrigin = origin
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  // Check against allowed domains (also normalized)
  for (const domain of allowedDomains) {
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();

    // Exact match or subdomain match
    if (normalizedOrigin === normalizedDomain || normalizedOrigin.endsWith('.' + normalizedDomain)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate session ID if not provided
 */
function getOrCreateSessionId(req: Request): string {
  // Try to get from body
  if (req.body.sessionId && typeof req.body.sessionId === 'string') {
    return req.body.sessionId;
  }

  // Generate new session ID (simple UUID-like, but we'll use timestamp + random)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `webchat_${timestamp}_${random}`;
}

/**
 * POST /api/chat
 * Public webchat API endpoint for widget
 */
export async function handleWebchatMessage(req: Request, res: Response): Promise<void> {
  const { widgetKey, sessionId, text } = req.body;

  // Validate inputs
  if (!widgetKey || typeof widgetKey !== 'string') {
    res.status(400).json({
      success: false,
      error: 'widgetKey is required',
    });
    return;
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'text is required and cannot be empty',
    });
    return;
  }

  // Validate text length
  if (text.length > 2000) {
    res.status(400).json({
      success: false,
      error: 'text must be 2000 characters or less',
    });
    return;
  }

  try {
    // Step 1: Resolve locationId from widget key
    const { data: widgetKeyData, error: keyError } = await supabaseAdmin
      .from('webchat_widget_keys')
      .select('location_id, allowed_domains, enabled')
      .eq('public_key', widgetKey)
      .eq('enabled', true)
      .maybeSingle();

    if (keyError) {
      logger.error('webchat.resolve_key_failed', keyError, redact({
        widgetKey: widgetKey.substring(0, 8) + '...',
      }), req);
      res.status(500).json({
        success: false,
        error: 'Failed to validate widget key',
      });
      return;
    }

    if (!widgetKeyData) {
      res.status(401).json({
        success: false,
        error: 'Invalid or disabled widget key',
      });
      return;
    }

    // Step 2: Validate origin against allowed domains
    const origin = req.headers.origin;
    const allowedDomains = widgetKeyData.allowed_domains || [];

    if (allowedDomains.length > 0 && !isOriginAllowed(origin, allowedDomains)) {
      logger.warn('webchat.origin_not_allowed', redact({
        origin,
        allowedDomains,
        widgetKey: widgetKey.substring(0, 8) + '...',
      }), req);
      res.status(403).json({
        success: false,
        error: 'Origin not allowed',
      });
      return;
    }

    // Step 3: Get or create session ID
    const finalSessionId = sessionId || getOrCreateSessionId(req);
    const externalUserId = `webchat:${finalSessionId}`;

    // Step 4: Check if webchat is enabled for this location
    const { data: channelsConfig } = await supabaseAdmin
      .from('channels_config')
      .select('webchat_enabled')
      .eq('location_id', widgetKeyData.location_id)
      .maybeSingle();

    if (channelsConfig?.webchat_enabled === false) {
      res.status(403).json({
        success: false,
        error: 'Webchat is disabled for this location',
      });
      return;
    }

    // Step 5: Call AgentCore
    const response = await agentCore.handleMessage({
      locationId: widgetKeyData.location_id,
      channel: 'webchat',
      externalUserId,
      text: text.trim(),
      metadata: {
        widgetKey: widgetKey.substring(0, 8) + '...',
        origin,
        sessionId: finalSessionId,
      },
    });

    // Step 6: Return response
    res.json({
      success: true,
      data: {
        text: response.text,
        sessionId: finalSessionId,
        toolCalls: response.toolCalls,
      },
    });

    logger.info('webchat.message_handled', redact({
      locationId: widgetKeyData.location_id,
      sessionId: finalSessionId,
      textLength: text.length,
      responseLength: response.text.length,
    }), req);
  } catch (error: any) {
    logger.error('webchat.handle_message_failed', error, redact({
      widgetKey: widgetKey?.substring(0, 8) + '...',
      textLength: text?.length,
    }), req);

    res.status(500).json({
      success: false,
      error: 'Failed to process message',
    });
  }
}
