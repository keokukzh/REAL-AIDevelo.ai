import { supabaseAdmin } from './supabaseDb';
import { config } from '../config/env';

const REQUIRED_TABLES = [
  'organizations',
  'users',
  'locations',
  'agent_configs',
  'phone_numbers',
  'google_calendar_integrations',
  'call_logs',
  'porting_requests',
] as const;

export interface PreflightResult {
  ok: boolean;
  missing: string[];
  projectUrl: string;
  timestamp: string;
}

/**
 * Check if all required Supabase tables exist
 * Returns preflight result with missing tables list
 */
export async function checkDbPreflight(): Promise<PreflightResult> {
  const missing: string[] = [];
  
  // Check each required table exists
  for (const tableName of REQUIRED_TABLES) {
    const { error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If error indicates table doesn't exist, add to missing
    if (error) {
      // Check if error is "relation does not exist" (PostgreSQL error code 42P01)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        missing.push(tableName);
      } else {
        // Other errors (permissions, etc.) - still consider table missing for safety
        console.warn(`[Preflight] Error checking table ${tableName}:`, error.message);
        missing.push(tableName);
      }
    }
  }
  
  return {
    ok: missing.length === 0,
    missing,
    projectUrl: config.supabaseUrl || 'not configured',
    timestamp: new Date().toISOString(),
  };
}
