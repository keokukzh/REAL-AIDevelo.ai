import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // Log error but don't crash - show user-friendly message
  console.error('❌ Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  });
  console.error('📝 Please set these in Cloudflare Pages → Settings → Environment Variables');
  
  // Show error in console
  if (typeof window !== 'undefined') {
    console.error('⚠️ Supabase not configured - authentication features will not work');
  }
}

// Create client with fallback to prevent crashes
// If env vars are missing, use dummy values (auth won't work but page loads)
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'dummy-key-placeholder';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: !!supabaseUrl && !!supabaseAnonKey,
    autoRefreshToken: !!supabaseUrl && !!supabaseAnonKey,
    detectSessionInUrl: !!supabaseUrl && !!supabaseAnonKey,
  },
});


