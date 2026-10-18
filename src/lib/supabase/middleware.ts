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

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Public pages never need the staff session, so don't call Supabase for
  // them at all — the website keeps working even if the staff database is
  // down. (/login still checks, to send signed-in staff to the dashboard.)
  if (isPublic(request.nextUrl.pathname) && request.nextUrl.pathname !== "/login") {
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

  const { pathname } = request.nextUrl;

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
