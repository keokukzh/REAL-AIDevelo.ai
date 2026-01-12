import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import {
  supabaseAdmin,
  ensureUserRow,
  ensureOrgForUser,
  ensureDefaultLocation,
  ensureAgentConfig,
} from '../services/supabaseDb';
import { InternalServerError, UnauthorizedError } from '../utils/errors';
import axios from 'axios';
import { config } from '../config/env';

export const getSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new UnauthorizedError('Unauthorized'));
    }

    const { supabaseUserId, email: authEmail } = req.supabaseUser;

    // 1. Ensure/Fetch core entities
    await ensureUserRow(supabaseUserId, authEmail || undefined);

    // Fetch full user data
    const { data: user, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (userFetchError || !user) {
      throw userFetchError || new Error('User not found after provisioning');
    }

    const organization = await ensureOrgForUser(supabaseUserId, authEmail || undefined);
    const location = await ensureDefaultLocation(organization.id);

    // Fetch all agents (agentConfigs) for the location
    const { data: agents } = await supabaseAdmin
      .from('agent_configs')
      .select('*')
      .eq('location_id', location.id);

    // 2. Get ElevenLabs Credits if API key is provided
    let quota = null;
    const elevenLabsApiKey = user.elevenlabs_api_key || config.elevenLabsApiKey;

    if (elevenLabsApiKey) {
      try {
        const quotaRes = await axios.get('https://api.elevenlabs.io/v1/user/subscription', {
          headers: { 'xi-api-key': elevenLabsApiKey },
        });
        const d = quotaRes.data;
        quota = {
          characterCount: d.character_count,
          characterLimit: d.character_limit,
          percentageUsed: ((d.character_count / d.character_limit) * 100).toFixed(1),
        };
      } catch (error) {
        console.error('[SettingsController] ElevenLabs Credits fetch error:', error);
      }
    }

    // 3. Check calendar integrations
    const { data: integrations } = await supabaseAdmin
      .from('google_calendar_integrations')
      .select('*')
      .eq('location_id', location.id)
      .maybeSingle();

    // 4. Assemble standard response
    const response: any = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name || user.email?.split('@')[0],
        company: user.company_name || organization.name,
        phone: user.phone_number,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      location: location || null,
      agents: agents || [],
      integrations: {
        elevenLabs: {
          connected: !!user.elevenlabs_api_key,
          quota: quota || null,
        },
        calendar: {
          connected: !!integrations,
          provider: integrations?.provider || null,
        },
        twilio: {
          connected: !!user.twilio_account_sid,
        },
      },
    };

    // 5. Add Warning ONLY (never return 400 here)
    if (quota && parseFloat(quota.percentageUsed) > 95) {
      response.warning = {
        type: 'quota_critical',
        severity: 'high',
        message: `ElevenLabs credits critically low (${quota.percentageUsed}% used). Please upgrade or wait for reset.`,
        action: 'upgrade_plan',
      };
    }

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('[SettingsController] Error loading settings:', error);
    next(new InternalServerError(error.message || 'Failed to load settings'));
  }
};

/**
 * PATCH /api/settings
 * Update User/Agent Settings
 */
export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.supabaseUser) {
      return next(new UnauthorizedError('Unauthorized'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const updates = req.body;
    const allowedFields = ['full_name', 'company_name', 'phone_number', 'elevenlabs_api_key'];

    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      return res.json({ success: true, message: 'No valid fields to update' });
    }

    // Update user row
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .update(filteredUpdates)
      .eq('supabase_user_id', supabaseUserId)
      .select()
      .single();

    if (userError) throw userError;

    res.json({ success: true, user });
  } catch (error: any) {
    console.error('[SettingsController] Error updating settings:', error);
    next(new InternalServerError(error.message || 'Failed to update settings'));
  }
};
