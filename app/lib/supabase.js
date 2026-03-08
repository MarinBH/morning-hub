// Supabase client — will be configured when Supabase project is created
// For now, app uses localStorage as fallback

let supabase = null;

export function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  // Lazy import to avoid issues when supabase is not installed yet
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(url, key);
    return supabase;
  } catch {
    return null;
  }
}

// Check if Supabase is configured
export function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
