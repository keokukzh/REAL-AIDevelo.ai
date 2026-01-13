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

    // 3. Check calendar integrations
    const { data: integrations } = await supabaseAdmin
      .from('calendar_connections')
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
        calendar: {
          connected: !!integrations,
          provider: integrations?.provider || null,
        },
        twilio: {
          connected: !!user.twilio_account_sid,
        },
      },
    };

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
    const allowedFields = ['full_name', 'company_name', 'phone_number'];

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
