import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';

/**
 * Supabase Client: Handles REST API connections to Supabase
 * Used for Auth management, RLS-aware queries, and admin operations.
 */

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  const url = config.supabaseUrl || process.env.SUPABASE_URL;
  const key = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return createMockSupabaseClient();
    }
    throw new Error('Supabase Configuration Missing (SUPABASE_URL / SERVICE_ROLE_KEY)');
  }

  supabaseAdminInstance = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
}

// Proxy export for backwards compatibility/lazy loading
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

function createMockSupabaseClient(): any {
  console.warn('[db/supabase] Using MOCK Supabase Client');
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'mock' } }) }) }),
      }),
    }),
    auth: { getUser: async () => ({ data: { user: { id: 'mock-user' } } }) },
  };
}
