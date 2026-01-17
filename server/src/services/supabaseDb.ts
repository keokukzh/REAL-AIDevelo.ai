// Re-export from new locations for backwards compatibility
export { supabaseAdmin } from '../db/supabase.js';
export {
  ensureUserRow,
  ensureOrgForUser,
  ensureDefaultLocation,
  ensureAgentConfig,
} from '../repositories/provisioningRepository.js';
export type { AgentConfigDBRow } from '../repositories/provisioningRepository.js';
