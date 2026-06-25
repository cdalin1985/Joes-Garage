import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Browser-side Supabase client (used inside client components).
 * Intentionally untyped at the query level — we apply explicit domain-type
 * casts (e.g. `data as Customer[]`) where results are consumed, which avoids
 * brittle select-string inference on relational queries.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
