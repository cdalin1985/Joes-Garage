/**
 * Centralized access to Supabase environment configuration.
 *
 * The URL and anon key are *publishable* values (the anon key is protected by
 * Row Level Security — it cannot bypass the access rules in the database), so
 * they're safe to ship in the client bundle. We keep them as defaults here so
 * the app works out of the box when deployed, while still letting Vercel /
 * local `.env` override them via NEXT_PUBLIC_* vars. Rotate anytime in the
 * Supabase dashboard if desired.
 */
const DEFAULT_SUPABASE_URL = "https://hqnsgxzjclcahyfhihom.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxbnNneHpqY2xjYWh5ZmhpaG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzcwNTAsImV4cCI6MjA5NzkxMzA1MH0.XsmYbCXg28RK1ZtI3ZuKxM1-5dbPxbFuq0e-5GbDG1A";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
