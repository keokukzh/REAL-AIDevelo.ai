// Re-export from new locations for backwards compatibility
export { supabaseAdmin } from '../db/supabase';
export {
  ensureUserRow,
  ensureOrgForUser,
  ensureDefaultLocation,
  ensureAgentConfig,
} from '../repositories/provisioningRepository';
