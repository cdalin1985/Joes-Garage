import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

/**
 * Returns the signed-in user's profile, or null. Cached per-request so multiple
 * components can call it without extra round-trips.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
});

/** Require a signed-in user; redirect to /login otherwise. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Require owner/admin; redirect to /dashboard for non-admins. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "owner" && profile.role !== "admin") {
    redirect("/dashboard?error=admin_only");
  }
  return profile;
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "owner" || profile?.role === "admin";
}
