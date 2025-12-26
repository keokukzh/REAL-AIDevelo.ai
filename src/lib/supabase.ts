import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for missing environment variables (only log in dev)
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    // Log error but don't crash - show user-friendly message (dev only)
    console.error('❌ Missing Supabase environment variables:', {
      VITE_SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
      VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ Set' : '❌ Missing',
    });
    console.error('📝 Please set these in Cloudflare Pages → Settings → Environment Variables');
  }
}

// Create client with fallback to prevent crashes
// If env vars are missing, use dummy values (auth won't work but page loads)
// BUT: If we detect a session in localStorage for a specific project, use that project's URL
let finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'dummy-key-placeholder';

// Check localStorage for existing session to determine correct project
if (typeof window !== 'undefined' && !supabaseUrl) {
  // Look for Supabase session keys in localStorage (format: sb-<project-ref>-auth-token)
  const sessionKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  if (sessionKeys.length > 0) {
    // Extract project ref from key (e.g., "sb-rckuwfcsqwwylffecwur-auth-token" -> "rckuwfcsqwwylffecwur")
    const projectRef = sessionKeys[0].replace('sb-', '').replace('-auth-token', '');
    // Use the project URL even if env var is missing (helps with debugging)
    finalUrl = `https://${projectRef}.supabase.co`;
    // Only warn in dev mode
    if (import.meta.env.DEV) {
      console.warn(`[Supabase] VITE_SUPABASE_URL not set, but detected session for project: ${projectRef}. Using: ${finalUrl}`);
      console.warn(`[Supabase] ⚠️ This is a fallback. Please set VITE_SUPABASE_URL in Cloudflare Pages environment variables.`);
    }
  }
}

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true, // Always enable persistence (even with placeholder, to read existing sessions)
    autoRefreshToken: !!supabaseUrl && !!supabaseAnonKey,
    detectSessionInUrl: !!supabaseUrl && !!supabaseAnonKey,
  },
});


