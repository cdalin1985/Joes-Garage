import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Server-only Supabase client using the service-role key, for the public
 * website's booking assistant (it has no signed-in user, and the appointment
 * tables are behind Row Level Security). Returns null when the key isn't set,
 * so callers can degrade to "please call the shop" instead of failing.
 *
 * Never import this from a client component — the key bypasses RLS.
 */
export function createAdminClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
