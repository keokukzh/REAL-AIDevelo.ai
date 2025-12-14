import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { twilioService } from '../services/twilioService';
import { supabaseAdmin, ensureDefaultLocation } from '../services/supabaseDb';
import { BadRequestError, InternalServerError } from '../utils/errors';

/**
 * GET /api/phone/numbers
 * List available Twilio phone numbers
 */
export const listPhoneNumbers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { country = 'CH' } = req.query;
    const numbers = await twilioService.listPhoneNumbers(country as string);

    res.json({
      success: true,
      data: numbers.map((num) => ({
        id: num.sid,
        providerSid: num.sid,
        number: num.phoneNumber,
        country: country as string,
        status: 'available' as const,
        capabilities: num.capabilities,
        metadata: {
          friendlyName: num.friendlyName,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/phone/connect
 * Save selected phone number in DB
 */
export const connectPhoneNumber = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { phoneNumberSid, phoneNumber } = req.body;

    if (!phoneNumberSid || !phoneNumber) {
      return next(new BadRequestError('phoneNumberSid and phoneNumber are required'));
    }

    const { supabaseUserId } = req.supabaseUser;

    // Get user's location
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (!userData) {
      return next(new InternalServerError('User not found'));
    }

    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('owner_user_id', userData.id)
      .single();

    if (!orgData) {
      return next(new InternalServerError('Organization not found'));
    }

    const location = await ensureDefaultLocation(orgData.id);

    // Check if phone number already exists for this location
    const { data: existingPhone } = await supabaseAdmin
      .from('phone_numbers')
      .select('id')
      .eq('location_id', location.id)
      .eq('twilio_number_sid', phoneNumberSid)
      .maybeSingle();

    if (existingPhone) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from('phone_numbers')
        .update({
          e164: phoneNumber,
          status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPhone.id);

      if (updateError) {
        console.error('[PhoneController] Error updating phone number:', updateError);
        return next(new InternalServerError('Failed to update phone number'));
      }
    } else {
      // Create new record
      const { error: insertError } = await supabaseAdmin.from('phone_numbers').insert({
        location_id: location.id,
        twilio_number_sid: phoneNumberSid,
        e164: phoneNumber,
        status: 'connected',
        mode: 'aidvelo_number',
      });

      if (insertError) {
        console.error('[PhoneController] Error inserting phone number:', insertError);
        return next(new InternalServerError('Failed to save phone number'));
      }
    }

    // Update webhook URLs in Twilio
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';
    if (publicBaseUrl) {
      const voiceUrl = `${publicBaseUrl}/api/twilio/voice/inbound`;
      const statusCallback = `${publicBaseUrl}/api/twilio/voice/status`;

      try {
        await twilioService.updateWebhooks(phoneNumberSid, voiceUrl, statusCallback);
      } catch (webhookError) {
        console.warn('[PhoneController] Failed to update webhooks in Twilio:', webhookError);
        // Don't fail the request if webhook update fails
      }
    }

    res.json({
      success: true,
      message: 'Phone number connected successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/phone/webhook-status
 * Check Twilio voice_url/status_callback configuration
 */
export const getWebhookStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { phoneNumberSid } = req.query;

    if (!phoneNumberSid || typeof phoneNumberSid !== 'string') {
      return next(new BadRequestError('phoneNumberSid query parameter is required'));
    }

    const webhookStatus = await twilioService.getWebhookStatus(phoneNumberSid);

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';
    const expectedVoiceUrl = publicBaseUrl ? `${publicBaseUrl}/api/twilio/voice/inbound` : null;
    const expectedStatusCallback = publicBaseUrl ? `${publicBaseUrl}/api/twilio/voice/status` : null;

    res.json({
      success: true,
      data: {
        current: webhookStatus,
        expected: {
          voiceUrl: expectedVoiceUrl,
          statusCallback: expectedStatusCallback,
        },
        isConfigured:
          webhookStatus.voiceUrl === expectedVoiceUrl &&
          webhookStatus.statusCallback === expectedStatusCallback,
      },
    });
  } catch (error) {
    next(error);
  }
};
