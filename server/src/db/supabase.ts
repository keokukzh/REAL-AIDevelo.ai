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

  const isPlaceholder =
    (key && key.includes('PLACEHOLDER')) || (url && url.includes('placeholder'));

  if (!url || !key || isPlaceholder) {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return createMockSupabaseClient();
    }
    if (!url || !key) {
      throw new Error('Supabase Configuration Missing (SUPABASE_URL / SERVICE_ROLE_KEY)');
    }
    // If it's a placeholder but not in bypass mode, we might still want to try it or throw a better error
    // For now, let's just proceed if it's not bypass, but log a warning
    console.warn(
      '[db/supabase] Placeholder configuration detected, but DEV_BYPASS_AUTH is not true. Expect failures.',
    );
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

  const mockResult = {
    data: [] as any[],
    error: null,
    count: 0,
  };

  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve(mockResult);
      }

      // If it's a known property on the target (like auth), return it
      if (prop in target) {
        const value = (target as any)[prop];
        return typeof value === 'object' && value !== null ? new Proxy(value, handler) : value;
      }

      // For any other access, return a function that returns a new Proxy
      // This allows chained calls like .from().select().eq()
      return (..._args: any[]) => new Proxy(target, handler);
    },
  };

  return new Proxy(
    {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'mock-user', email: 'dev@aidevelo.local' } },
          error: null,
        }),
        getSession: async () => ({ data: { session: { user: { id: 'mock-user' } } }, error: null }),
        signOut: async () => ({ error: null }),
      },
    },
    handler,
  );
}
