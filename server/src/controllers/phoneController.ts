import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { twilioService } from '../services/twilioService';
import { supabaseAdmin, ensureDefaultLocation, ensureUserRow, ensureOrgForUser } from '../services/supabaseDb';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { config } from '../config/env';

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
    
    // Check if Twilio is configured
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const twilioAuthToken = config.twilioAuthToken || '';
    const isTwilioConfigured = !!(twilioAccountSid && twilioAuthToken);

    let numbers;
    let isMockData = false;
    
    try {
      numbers = await twilioService.listPhoneNumbers(country as string);
      
      // Check if we got mock data (indicates Twilio not configured)
      if (!isTwilioConfigured && numbers.length > 0) {
        isMockData = numbers.some(num => num.sid.startsWith('mock_'));
      }
    } catch (error: any) {
      // If Twilio API call fails, return helpful error
      console.error('[PhoneController] Error fetching phone numbers:', error);
      
      if (!isTwilioConfigured) {
        return res.json({
          success: true,
          data: [],
          warning: 'Twilio API keys not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Render environment variables.',
          isMockData: false,
        });
      }
      
      // If configured but API call failed, return error
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch phone numbers from Twilio',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }

    // Map numbers to response format
    const mappedNumbers = numbers.map((num) => ({
      id: num.sid,
      providerSid: num.sid,
      number: num.phoneNumber,
      country: country as string,
      status: 'available' as const,
      capabilities: num.capabilities,
      metadata: {
        friendlyName: num.friendlyName,
      },
    }));

    res.json({
      success: true,
      data: mappedNumbers,
      ...(isMockData && {
        warning: 'Twilio API keys not configured. Showing mock data for testing. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Render environment variables.',
        isMockData: true,
      }),
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

    const { supabaseUserId, email } = req.supabaseUser;

    // Get user's location (consistent pattern with other endpoints)
    await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

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
        console.log('[PhoneController] Phone number connected, webhooks updated:', {
          phoneNumberSid,
          voiceUrl,
          statusCallback,
        });
      } catch (webhookError) {
        console.warn('[PhoneController] Failed to update webhooks in Twilio:', webhookError);
        // Don't fail the request if webhook update fails
      }
    } else {
      console.warn('[PhoneController] PUBLIC_BASE_URL not set, skipping webhook update');
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
 * Normalize URL for comparison (removes trailing slashes, normalizes scheme)
 */
function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  
  try {
    // Trim whitespace
    let normalized = url.trim();
    
    // Remove trailing slashes (but keep protocol://host)
    normalized = normalized.replace(/\/+$/, '');
    
    // Parse URL to normalize scheme (http vs https)
    const urlObj = new URL(normalized);
    // Keep original scheme but lowercase host
    urlObj.hostname = urlObj.hostname.toLowerCase();
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return trimmed version
    return url.trim().replace(/\/+$/, '');
  }
}

/**
 * Compare two URLs (handles trailing slashes, scheme differences)
 */
function urlsMatch(url1: string | null, url2: string | null): boolean {
  if (!url1 || !url2) return false;
  
  const normalized1 = normalizeUrl(url1);
  const normalized2 = normalizeUrl(url2);
  
  if (!normalized1 || !normalized2) return false;
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Also check if only scheme differs (http vs https)
  try {
    const url1Obj = new URL(normalized1);
    const url2Obj = new URL(normalized2);
    
    // Compare everything except scheme
    return (
      url1Obj.hostname === url2Obj.hostname &&
      url1Obj.pathname === url2Obj.pathname &&
      url1Obj.search === url2Obj.search &&
      url1Obj.hash === url2Obj.hash &&
      url1Obj.port === url2Obj.port
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/phone/webhook-status
 * Check Twilio voice_url/status_callback configuration
 * Automatically detects phone number from user's location
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

    const { supabaseUserId, email } = req.supabaseUser;

    // Get user's location (same pattern as dashboard overview)
    await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

    // Load phone number for this location
    const { data: phoneData } = await supabaseAdmin
      .from('phone_numbers')
      .select('twilio_number_sid, e164, customer_public_number')
      .eq('location_id', location.id)
      .limit(1)
      .maybeSingle();

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';
    const expectedVoiceUrl = publicBaseUrl ? `${publicBaseUrl}/api/twilio/voice/inbound` : '';
    const expectedStatusCallbackUrl = publicBaseUrl ? `${publicBaseUrl}/api/twilio/voice/status` : '';

    // If no phone number connected
    if (!phoneData?.twilio_number_sid) {
      console.log('[PhoneController] Webhook status check - no phone number connected', {
        org_id: org.id,
        location_id: location.id,
        phone_sid: null,
        matches: { voiceUrl: false, statusCallbackUrl: false },
      });

      return res.json({
        success: true,
        data: {
          configured: {
            voiceUrl: null,
            statusCallbackUrl: null,
          },
          expected: {
            voiceUrl: expectedVoiceUrl,
            statusCallbackUrl: expectedStatusCallbackUrl,
          },
          matches: {
            voiceUrl: false,
            statusCallbackUrl: false,
          },
          phoneNumber: null,
        },
      });
    }

    // Get webhook status from Twilio
    const webhookStatus = await twilioService.getWebhookStatus(phoneData.twilio_number_sid);

    // Compare URLs (normalized comparison)
    const voiceUrlMatches = urlsMatch(webhookStatus.voiceUrl, expectedVoiceUrl);
    const statusCallbackMatches = urlsMatch(webhookStatus.statusCallback, expectedStatusCallbackUrl);

    console.log('[PhoneController] Webhook status check', {
      org_id: org.id,
      location_id: location.id,
      phone_sid: phoneData.twilio_number_sid,
      matches: {
        voiceUrl: voiceUrlMatches,
        statusCallbackUrl: statusCallbackMatches,
      },
    });

    res.json({
      success: true,
      data: {
        configured: {
          voiceUrl: webhookStatus.voiceUrl,
          statusCallbackUrl: webhookStatus.statusCallback,
        },
        expected: {
          voiceUrl: expectedVoiceUrl,
          statusCallbackUrl: expectedStatusCallbackUrl,
        },
        matches: {
          voiceUrl: voiceUrlMatches,
          statusCallbackUrl: statusCallbackMatches,
        },
        phoneNumber: {
          sid: phoneData.twilio_number_sid,
          number: phoneData.e164 || phoneData.customer_public_number || '',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/phone/test-webhook
 * Test webhook endpoint (dev/test only)
 * Validates webhook configuration without making actual Twilio call
 */
export const testWebhook = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Security: Only allow in dev/test environments
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        success: false,
        error: 'Not found',
      });
    }

    // Also check DEV_BYPASS_AUTH flag
    if (process.env.DEV_BYPASS_AUTH !== 'true' && process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        success: false,
        error: 'Not found',
      });
    }

    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Get user's location and phone number
    await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

    const { data: phoneData } = await supabaseAdmin
      .from('phone_numbers')
      .select('twilio_number_sid')
      .eq('location_id', location.id)
      .limit(1)
      .maybeSingle();

    if (!phoneData?.twilio_number_sid) {
      return res.json({
        success: true,
        data: {
          attempted: true,
          result: 'failed',
          details: 'No phone number connected',
        },
      });
    }

    // Get webhook status to validate
    const webhookStatus = await twilioService.getWebhookStatus(phoneData.twilio_number_sid);
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';
    const expectedVoiceUrl = publicBaseUrl ? `${publicBaseUrl}/api/twilio/voice/inbound` : '';
    const expectedStatusCallbackUrl = publicBaseUrl ? `${publicBaseUrl}/api/twilio/voice/status` : '';

    const voiceUrlMatches = urlsMatch(webhookStatus.voiceUrl, expectedVoiceUrl);
    const statusCallbackMatches = urlsMatch(webhookStatus.statusCallback, expectedStatusCallbackUrl);

    const allMatch = voiceUrlMatches && statusCallbackMatches;

    console.log('[PhoneController] Test webhook validation', {
      org_id: org.id,
      location_id: location.id,
      phone_sid: phoneData.twilio_number_sid,
      matches: { voiceUrl: voiceUrlMatches, statusCallbackUrl: statusCallbackMatches },
    });

    res.json({
      success: true,
      data: {
        attempted: true,
        result: allMatch ? 'ok' : 'failed',
        details: allMatch
          ? 'Webhook URLs are correctly configured'
          : 'Webhook URLs do not match expected values',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/phone/health
 * Check Twilio Gateway health status
 * Returns detailed health information including API keys, phone connection, and webhooks
 */
export const checkTwilioGatewayHealth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Get user's location
    await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

    // Check Twilio API configuration
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const twilioAuthToken = config.twilioAuthToken || '';
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';

    const healthChecks: Record<string, { ok: boolean; message: string; details?: any }> = {
      apiKeys: {
        ok: !!(twilioAccountSid && twilioAuthToken),
        message: twilioAccountSid && twilioAuthToken
          ? 'Twilio API keys are configured'
          : 'Twilio API keys are missing (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN)',
        details: {
          hasAccountSid: !!twilioAccountSid,
          hasAuthToken: !!twilioAuthToken,
        },
      },
      publicUrl: {
        ok: !!publicBaseUrl,
        message: publicBaseUrl
          ? `Public base URL is configured: ${publicBaseUrl}`
          : 'PUBLIC_BASE_URL is not set (required for webhooks)',
        details: {
          publicBaseUrl: publicBaseUrl || null,
        },
      },
      phoneConnection: {
        ok: false,
        message: 'No phone number connected',
        details: {
          phoneNumber: null,
          status: null,
        },
      },
      webhooks: {
        ok: false,
        message: 'Webhooks not configured (no phone number connected)',
        details: {
          voiceUrl: null,
          statusCallbackUrl: null,
          matches: {
            voiceUrl: false,
            statusCallbackUrl: false,
          },
        },
      },
    };

    // Check phone number connection
    const { data: phoneData } = await supabaseAdmin
      .from('phone_numbers')
      .select('twilio_number_sid, e164, customer_public_number, status')
      .eq('location_id', location.id)
      .limit(1)
      .maybeSingle();

    if (phoneData?.twilio_number_sid) {
      healthChecks.phoneConnection = {
        ok: phoneData.status === 'connected',
        message: phoneData.status === 'connected'
          ? `Phone number connected: ${phoneData.e164 || phoneData.customer_public_number}`
          : `Phone number exists but status is '${phoneData.status}' (expected 'connected')`,
        details: {
          phoneNumber: phoneData.e164 || phoneData.customer_public_number || null,
          status: phoneData.status,
          twilioNumberSid: phoneData.twilio_number_sid,
        },
      };

      // Check webhook configuration if phone is connected
      if (phoneData.status === 'connected' && publicBaseUrl) {
        try {
          const webhookStatus = await twilioService.getWebhookStatus(phoneData.twilio_number_sid);
          const expectedVoiceUrl = `${publicBaseUrl}/api/twilio/voice/inbound`;
          const expectedStatusCallbackUrl = `${publicBaseUrl}/api/twilio/voice/status`;

          const voiceUrlMatches = urlsMatch(webhookStatus.voiceUrl, expectedVoiceUrl);
          const statusCallbackMatches = urlsMatch(webhookStatus.statusCallback, expectedStatusCallbackUrl);

          healthChecks.webhooks = {
            ok: voiceUrlMatches && statusCallbackMatches,
            message: voiceUrlMatches && statusCallbackMatches
              ? 'Webhooks are correctly configured'
              : 'Webhook URLs do not match expected values',
            details: {
              configured: {
                voiceUrl: webhookStatus.voiceUrl,
                statusCallbackUrl: webhookStatus.statusCallback,
              },
              expected: {
                voiceUrl: expectedVoiceUrl,
                statusCallbackUrl: expectedStatusCallbackUrl,
              },
              matches: {
                voiceUrl: voiceUrlMatches,
                statusCallbackUrl: statusCallbackMatches,
              },
            },
          };
        } catch (webhookError: any) {
          healthChecks.webhooks = {
            ok: false,
            message: `Failed to check webhook status: ${webhookError.message || 'Unknown error'}`,
            details: {
              error: webhookError.message || 'Unknown error',
            },
          };
        }
      }
    }

    // Determine overall health status
    const allChecksOk = Object.values(healthChecks).every(check => check.ok);
    const criticalChecksOk = healthChecks.apiKeys.ok && healthChecks.publicUrl.ok;

    // Overall status
    let overallStatus: 'ok' | 'error' | 'warning' = 'ok';
    if (!criticalChecksOk) {
      overallStatus = 'error';
    } else if (!healthChecks.phoneConnection.ok) {
      overallStatus = 'error';
    } else if (!healthChecks.webhooks.ok) {
      overallStatus = 'warning';
    }

    res.json({
      success: true,
      data: {
        status: overallStatus,
        allChecksOk,
        checks: healthChecks,
        recommendations: !allChecksOk ? [
          !healthChecks.apiKeys.ok && 'Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Render environment variables',
          !healthChecks.publicUrl.ok && 'Set PUBLIC_BASE_URL in Render environment variables (e.g., https://aidevelo.ai)',
          !healthChecks.phoneConnection.ok && 'Connect a phone number via the "Telefon verbinden" button in the dashboard',
          healthChecks.phoneConnection.ok && !healthChecks.webhooks.ok && 'Webhook URLs need to be updated. Try reconnecting the phone number or use the "Webhook Status prüfen" button.',
        ].filter(Boolean) : [],
      },
    });
  } catch (error) {
    next(error);
  }
};
