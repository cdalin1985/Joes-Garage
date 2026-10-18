import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

/**
 * Routes that do not require authentication: the public marketing website,
 * the sign-in flow, the customer-facing inspection share link, and the
 * website assistant's API.
 *
 * Matched exactly — "/" must never be treated as a prefix or it would make
 * the entire staff application public.
 */
const PUBLIC_EXACT = new Set([
  "/", // marketing home
  "/about",
  "/contact",
  "/services",
  "/login",
  "/setup",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/api/assistant", // the website's chat + booking assistant (validates its own input)
  "/requests", // Joe's booking-requests page (PIN-protected, not Supabase)
]);

/** Routes where everything beneath the prefix is also public. */
const PUBLIC_PREFIXES = [
  "/services/", // one page per service
  "/inspect/", // customer's photo inspection, opened from a texted link
  "/auth/",
  "/_next/",
  "/opengraph-image", // generated share image (may carry a hash suffix)
  "/icon", // generated favicon (may carry a hash suffix)
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * First path segments of the staff application (src/app/(app)) and its APIs.
 * Only these send signed-out visitors to /login. Any other unknown path falls
 * through to the site's 404 page, so search engines see a real "not found"
 * instead of a redirect to the staff login.
 */
const STAFF_SEGMENTS = new Set([
  "api",
  "dashboard",
  "customers",
  "vehicles",
  "estimates",
  "invoices",
  "work-orders",
  "parts",
  "appointments",
  "follow-ups",
  "labor-presets",
  "accounting",
  "settings",
  "staff",
]);

function isStaffRoute(pathname: string): boolean {
  return STAFF_SEGMENTS.has(pathname.split("/")[1] ?? "");
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // Public pages and non-staff paths never need the staff session, so don't
  // call Supabase for them at all — the website keeps working even if the
  // staff database is down. (/login still checks, to send signed-in staff to
  // the dashboard.)
  if ((isPublic(pathname) || !isStaffRoute(pathname)) && pathname !== "/login") {
    return response;
  }

  // If Supabase isn't configured yet, don't block — let pages render a
  // friendly "connect your project" message.
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated users hitting a protected route -> login
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users hitting /login -> dashboard
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
