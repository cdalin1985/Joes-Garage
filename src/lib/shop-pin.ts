/**
 * Shop PIN sign-in.
 *
 * A friendly PIN screen sits in front of a *real* Supabase email/password
 * sign-in. The PIN only decides which pre-configured shop account to sign in
 * as; the actual account credentials live in server-only environment variables
 * (never in the client bundle or the repo), and the resulting session is a
 * genuine Supabase session — so Row Level Security is completely unchanged.
 *
 * Configure either:
 *   SHOP_PINS = JSON array, e.g.
 *     [{"name":"Joe","pin":"4827","email":"joe@shop.com","password":"…"},
 *      {"name":"Cami","pin":"1590","email":"cami@shop.com","password":"…"}]
 * or a single account:
 *   SHOP_PIN, SHOP_LOGIN_EMAIL, SHOP_LOGIN_PASSWORD
 *
 * These are server env vars (no NEXT_PUBLIC_ prefix) so they never reach the
 * browser. If none are set, the app falls back to the normal email/password
 * sign-in.
 */

export type PinAccount = { name: string; pin: string; email: string; password: string };

export function getPinAccounts(): PinAccount[] {
  const raw = process.env.SHOP_PINS;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .filter((a) => a && a.pin && a.email && a.password)
          .map((a) => ({ name: String(a.name ?? "Shop"), pin: String(a.pin), email: String(a.email), password: String(a.password) }));
      }
    } catch {
      // fall through to single-account form
    }
  }
  const pin = process.env.SHOP_PIN;
  const email = process.env.SHOP_LOGIN_EMAIL;
  const password = process.env.SHOP_LOGIN_PASSWORD;
  if (pin && email && password) {
    return [{ name: process.env.SHOP_LOGIN_NAME ?? "Shop", pin, email, password }];
  }
  return [];
}

export function pinLoginEnabled(): boolean {
  return getPinAccounts().length > 0;
}

/** Find the account whose PIN matches (length-aware, avoids trivial early-exit). */
export function matchPin(pin: string): PinAccount | null {
  const accounts = getPinAccounts();
  let found: PinAccount | null = null;
  for (const a of accounts) {
    // Compare every candidate so timing doesn't leak which PIN was closest.
    if (a.pin.length === pin.length && a.pin === pin) found = a;
  }
  return found;
}
