import { Router, Response } from 'express';
import { verifySupabaseAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, redact } from '../utils/logger';
import { resolveLocationId } from '../utils/locationIdResolver';
import crypto from 'node:crypto';

const router = Router();

/**
 * GET /api/channels/config
 * Get channels configuration for authenticated user's location
 */
router.get('/config', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resolution = await resolveLocationId(req, {
      supabaseUserId: req.supabaseUser?.supabaseUserId,
      email: req.supabaseUser?.email,
    });

    const { data: config, error } = await supabaseAdmin
      .from('channels_config')
      .select('*')
      .eq('location_id', resolution.locationId)
      .maybeSingle();

    if (error) {
      logger.error('channels.get_config_failed', error, redact({
        locationId: resolution.locationId,
      }), req);
      return res.status(500).json({
        success: false,
        error: 'Failed to get channels config',
      });
    }

    // Get webchat widget keys
    const { data: widgetKeys, error: keysError } = await supabaseAdmin
      .from('webchat_widget_keys')
      .select('*')
      .eq('location_id', resolution.locationId)
      .order('created_at', { ascending: false });

    if (keysError) {
      logger.error('channels.get_widget_keys_failed', keysError, redact({
        locationId: resolution.locationId,
      }), req);
    }

    // Get webhook URL
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://aidevelo.ai';
    const webhookUrl = `${publicBaseUrl}/api/twilio/whatsapp/inbound`;

    res.json({
      success: true,
      data: {
        config: config || {
          location_id: resolution.locationId,
          whatsapp_to: null,
          whatsapp_enabled: true,
          webchat_enabled: true,
        },
        widgetKeys: widgetKeys || [],
        webhookUrl,
      },
    });
  } catch (error: any) {
    logger.error('channels.get_config_error', error, redact({}), req);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get channels config',
    });
  }
});

/**
 * PATCH /api/channels/config
 * Update channels configuration
 */
router.patch('/config', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resolution = await resolveLocationId(req, {
      supabaseUserId: req.supabaseUser?.supabaseUserId,
      email: req.supabaseUser?.email,
    });

    const { whatsapp_to, whatsapp_enabled, webchat_enabled } = req.body;

    // Check if config exists
    const { data: existing } = await supabaseAdmin
      .from('channels_config')
      .select('id')
      .eq('location_id', resolution.locationId)
      .maybeSingle();

    const configData: any = {
      location_id: resolution.locationId,
    };

    // Set enabled flags (default to true if not provided)
    if (typeof whatsapp_enabled === 'boolean') {
      configData.whatsapp_enabled = whatsapp_enabled;
    } else {
      configData.whatsapp_enabled = true;
    }

    if (typeof webchat_enabled === 'boolean') {
      configData.webchat_enabled = webchat_enabled;
    } else {
      configData.webchat_enabled = true;
    }

    // Set whatsapp_to if provided
    if (typeof whatsapp_to === 'string') {
      configData.whatsapp_to = whatsapp_to || null;
    } else if (whatsapp_to === null) {
      configData.whatsapp_to = null;
    }

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('channels_config')
        .update(configData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('channels_config')
        .insert(configData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    logger.info('channels.config_updated', redact({
      locationId: resolution.locationId,
      whatsapp_enabled: result.whatsapp_enabled,
      webchat_enabled: result.webchat_enabled,
    }), req);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('channels.update_config_failed', error, redact({}), req);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update channels config',
    });
  }
});

/**
 * POST /api/channels/widget-keys
 * Create a new webchat widget key
 */
router.post('/widget-keys', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resolution = await resolveLocationId(req, {
      supabaseUserId: req.supabaseUser?.supabaseUserId,
      email: req.supabaseUser?.email,
    });

    const { allowed_domains } = req.body;

    // Generate random public key
    const publicKey = `wkey_${crypto.randomBytes(16).toString('hex')}`;

    const { data: widgetKey, error } = await supabaseAdmin
      .from('webchat_widget_keys')
      .insert({
        location_id: resolution.locationId,
        public_key: publicKey,
        allowed_domains: Array.isArray(allowed_domains) ? allowed_domains : [],
        enabled: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('channels.create_widget_key_failed', error, redact({
        locationId: resolution.locationId,
      }), req);
      return res.status(500).json({
        success: false,
        error: 'Failed to create widget key',
      });
    }

    logger.info('channels.widget_key_created', redact({
      locationId: resolution.locationId,
      widgetKeyId: widgetKey.id,
    }), req);

    res.json({
      success: true,
      data: widgetKey,
    });
  } catch (error: any) {
    logger.error('channels.create_widget_key_error', error, redact({}), req);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create widget key',
    });
  }
});

/**
 * PATCH /api/channels/widget-keys/:id
 * Update a widget key
 */
router.patch('/widget-keys/:id', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resolution = await resolveLocationId(req, {
      supabaseUserId: req.supabaseUser?.supabaseUserId,
      email: req.supabaseUser?.email,
    });

    const { id } = req.params;
    const { allowed_domains, enabled } = req.body;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('webchat_widget_keys')
      .select('location_id')
      .eq('id', id)
      .eq('location_id', resolution.locationId)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Widget key not found',
      });
    }

    const updateData: any = {};
    if (allowed_domains !== undefined) {
      updateData.allowed_domains = Array.isArray(allowed_domains) ? allowed_domains : [];
    }
    if (enabled !== undefined) {
      updateData.enabled = enabled;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('webchat_widget_keys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('channels.update_widget_key_failed', error, redact({
        widgetKeyId: id,
      }), req);
      return res.status(500).json({
        success: false,
        error: 'Failed to update widget key',
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    logger.error('channels.update_widget_key_error', error, redact({}), req);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update widget key',
    });
  }
});

/**
 * DELETE /api/channels/widget-keys/:id
 * Delete a widget key
 */
router.delete('/widget-keys/:id', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resolution = await resolveLocationId(req, {
      supabaseUserId: req.supabaseUser?.supabaseUserId,
      email: req.supabaseUser?.email,
    });

    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('webchat_widget_keys')
      .select('location_id')
      .eq('id', id)
      .eq('location_id', resolution.locationId)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Widget key not found',
      });
    }

    const { error } = await supabaseAdmin
      .from('webchat_widget_keys')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('channels.delete_widget_key_failed', error, redact({
        widgetKeyId: id,
      }), req);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete widget key',
      });
    }

    res.json({
      success: true,
      message: 'Widget key deleted',
    });
  } catch (error: any) {
    logger.error('channels.delete_widget_key_error', error, redact({}), req);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete widget key',
    });
  }
});

export default router;
