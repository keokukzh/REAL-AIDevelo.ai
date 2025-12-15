import { Request } from 'express';
import { supabaseAdmin } from '../services/supabaseDb';
import { ensureDefaultLocation, ensureOrgForUser, ensureUserRow } from '../services/supabaseDb';

export interface LocationIdResolution {
  locationId: string;
  source: 'header' | 'body' | 'callSid' | 'phoneNumber' | 'devFallback';
}

/**
 * Resolve locationId from request context
 * Priority:
 * 1. Header x-location-id or body.locationId
 * 2. Twilio Call Context: callSid -> call_logs -> location_id
 * 3. Twilio Call Context: phoneNumber -> phone_numbers -> location_id
 * 4. Dev fallback: ensureDefaultLocation() (only in dev/test)
 * 
 * In production, throws if locationId cannot be resolved
 */
export async function resolveLocationId(
  req: Request,
  options?: {
    callSid?: string;
    phoneNumber?: string;
    supabaseUserId?: string;
    email?: string;
  }
): Promise<LocationIdResolution> {
  // PRIORITY 1: Request header or body
  const headerLocationId = req.headers['x-location-id'] as string | undefined;
  const bodyLocationId = req.body?.locationId as string | undefined;
  
  if (headerLocationId) {
    console.log(`[LocationIdResolver] Resolved from header: ${headerLocationId}`);
    return { locationId: headerLocationId, source: 'header' };
  }
  
  if (bodyLocationId) {
    console.log(`[LocationIdResolver] Resolved from body: ${bodyLocationId}`);
    return { locationId: bodyLocationId, source: 'body' };
  }

  // PRIORITY 2: Twilio Call Context - callSid -> call_logs -> location_id
  const callSid = options?.callSid || req.body?.CallSid || req.query?.CallSid;
  if (callSid && typeof callSid === 'string') {
    try {
      const { data: callLog } = await supabaseAdmin
        .from('call_logs')
        .select('location_id')
        .eq('call_sid', callSid)
        .maybeSingle();

      if (callLog?.location_id) {
        console.log(`[LocationIdResolver] Resolved from callSid ${callSid}: ${callLog.location_id}`);
        return { locationId: callLog.location_id, source: 'callSid' };
      }
    } catch (error) {
      console.warn(`[LocationIdResolver] Error resolving from callSid: ${error}`);
    }
  }

  // PRIORITY 2b: Twilio Call Context - phoneNumber -> phone_numbers -> location_id
  const phoneNumber = options?.phoneNumber || req.body?.From || req.body?.To || req.body?.Called;
  if (phoneNumber && typeof phoneNumber === 'string') {
    try {
      const { data: phoneData } = await supabaseAdmin
        .from('phone_numbers')
        .select('location_id')
        .or(`e164.eq.${phoneNumber},customer_public_number.eq.${phoneNumber}`)
        .limit(1)
        .maybeSingle();

      if (phoneData?.location_id) {
        console.log(`[LocationIdResolver] Resolved from phoneNumber ${phoneNumber}: ${phoneData.location_id}`);
        return { locationId: phoneData.location_id, source: 'phoneNumber' };
      }
    } catch (error) {
      console.warn(`[LocationIdResolver] Error resolving from phoneNumber: ${error}`);
    }
  }

  // PRIORITY 3: User's default location - ensureDefaultLocation
  // This works in both dev and production for authenticated requests
  const supabaseUserId = options?.supabaseUserId || (req as any).supabaseUser?.supabaseUserId;
  const email = options?.email || (req as any).supabaseUser?.email;

  if (supabaseUserId) {
    try {
      const user = await ensureUserRow(supabaseUserId, email);
      const org = await ensureOrgForUser(supabaseUserId, email);
      const location = await ensureDefaultLocation(org.id);

      console.log(`[LocationIdResolver] Resolved from user's default location (ensureDefaultLocation): ${location.id}`);
      return { locationId: location.id, source: 'devFallback' };
    } catch (error) {
      console.warn(`[LocationIdResolver] Error resolving from user's default location: ${error}`);
    }
  }

  // Fail if locationId cannot be resolved
  throw new Error(
    'Unable to resolve locationId. ' +
    'Provide x-location-id header, body.locationId, callSid (via call_logs), phoneNumber (via phone_numbers), ' +
    'or ensure authenticated request with supabaseUser for default location fallback.'
  );
}
