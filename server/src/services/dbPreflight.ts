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
  warnings: string[];
  projectUrl: string;
  timestamp: string;
}

/**
 * Check if all required Supabase tables exist and security hardening is applied
 * Returns preflight result with missing tables list and security warnings
 * 
 * Note: RLS and function search_path verification requires direct SQL access
 * (run verification queries from docs/SUPABASE_SECURITY_HARDENING.md)
 */
export async function checkDbPreflight(): Promise<PreflightResult> {
  const missing: string[] = [];
  const warnings: string[] = [];
  
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
  
  // Check if set_updated_at function exists
  // Note: We can't verify search_path via PostgREST, so we'll just check existence
  try {
    // Try to query information_schema.routines (if accessible)
    // This is a best-effort check - full verification requires direct SQL
    const { data: funcExists, error: funcError } = await supabaseAdmin
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'set_updated_at')
      .limit(1);
    
    if (funcError || !funcExists || funcExists.length === 0) {
      warnings.push('set_updated_at function not found - ensure schema.sql is applied');
    } else {
      // Function exists, but we can't verify search_path via PostgREST
      // Add informational warning to verify manually
      warnings.push('Verify set_updated_at has SET search_path = public, pg_catalog (run security_hardening.sql)');
    }
  } catch (error) {
    // If we can't check, add warning
    warnings.push('Could not verify set_updated_at function - ensure schema.sql and security_hardening.sql are applied');
  }
  
  // Add warning about RLS verification
  // Since we use service_role (bypasses RLS), we can't easily verify RLS status via PostgREST
  // Users should run the verification queries from the documentation
  if (missing.length === 0) {
    warnings.push('Verify RLS is enabled on all tables (run verification queries from docs/SUPABASE_SECURITY_HARDENING.md)');
  }
  
  return {
    ok: missing.length === 0,
    missing,
    warnings: warnings.length > 0 ? warnings : [],
    projectUrl: config.supabaseUrl || 'not configured',
    timestamp: new Date().toISOString(),
  };
}
