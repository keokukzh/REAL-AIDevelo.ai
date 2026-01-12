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

/**
 * GET /api/settings
 * Loads all settings for the authenticated user
 */
export const getSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUser) {
      return next(new UnauthorizedError('Unauthorized'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Ensure user, org, location, and agent config exist
    const userRow = await ensureUserRow(supabaseUserId, email || undefined);
    const org = await ensureOrgForUser(supabaseUserId, email || undefined);
    const location = await ensureDefaultLocation(org.id);
    const agentConfig = await ensureAgentConfig(location.id);

    // Get ElevenLabs Credits if API key is provided
    let elevenLabsCredits = null;
    const elevenLabsApiKey = config.elevenLabsApiKey; // Fallback to system key if needed

    if (elevenLabsApiKey) {
      try {
        const response = await axios.get('https://api.elevenlabs.io/v1/user/subscription', {
          headers: { 'xi-api-key': elevenLabsApiKey },
        });
        const data = response.data;
        elevenLabsCredits = {
          characterCount: data.character_count,
          characterLimit: data.character_limit,
          percentageUsed: ((data.character_count / data.character_limit) * 100).toFixed(1),
        };
      } catch (error) {
        console.error('[SettingsController] ElevenLabs Credits fetch error:', error);
      }
    }

    // Check calendar connection
    const { data: calendarIntegration } = await supabaseAdmin
      .from('google_calendar_integrations')
      .select('id')
      .eq('location_id', location.id)
      .maybeSingle();

    // Check phone numbers
    const { data: phoneNumbers } = await supabaseAdmin
      .from('phone_numbers')
      .select('*')
      .eq('location_id', location.id);

    res.json({
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.id, // Fallback
        company: org.name,
      },
      subscription: { plan: 'free', status: 'active' },
      agentConfig: [agentConfig],
      elevenLabsCredits,
      calendarConnected: !!calendarIntegration,
      twilioConnected: !!process.env.TWILIO_ACCOUNT_SID,
    });
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
