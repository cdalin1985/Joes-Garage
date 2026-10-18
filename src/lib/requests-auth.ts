import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Query } from "@/lib/db";

/**
 * PIN lock for Joe's /requests page. The PIN lives in the BOOKING_PIN env var
 * (server-only); unlocking sets an httpOnly cookie holding an HMAC derived
 * from the PIN, so changing the PIN signs everyone out. Unlock attempts are
 * rate-limited through the database (pin_attempts), which every server
 * instance shares, so the PIN can't be brute-forced in parallel.
 */

export const REQUESTS_COOKIE = "joes_requests";
export const REQUESTS_PATH = "/requests";
const MIN_PIN_LENGTH = 6;

export type PinState = "missing" | "too_short" | "ok";

export function pinState(): PinState {
  const pin = process.env.BOOKING_PIN ?? "";
  if (!pin) return "missing";
  return pin.length < MIN_PIN_LENGTH ? "too_short" : "ok";
}

const digest = (key: string, value: string) => createHmac("sha256", key).update(value).digest();

/** The cookie value that proves the PIN was entered. */
export function unlockToken(): string {
  return digest(process.env.BOOKING_PIN ?? "", "joes-requests-v1").toString("hex");
}

/** Constant-time PIN check. */
export function pinMatches(input: string): boolean {
  if (pinState() !== "ok") return false;
  return timingSafeEqual(digest("pin-compare", input), digest("pin-compare", process.env.BOOKING_PIN ?? ""));
}

export function isUnlocked(): boolean {
  if (pinState() !== "ok") return false;
  const given = Buffer.from(cookies().get(REQUESTS_COOKIE)?.value ?? "");
  const expected = Buffer.from(unlockToken());
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Unlock attempts allowed before the page refuses to check the PIN. */
export const PIN_LIMITS = { perIpPer15Min: 8, sitewidePerHour: 40 };

/**
 * Records an unlock attempt, then says whether it may go ahead. The attempt is
 * saved before counting, so a burst of parallel requests can't all slip under
 * the limit: each one's count includes every attempt that checked before it.
 */
export async function allowPinAttempt(db: Query, ip: string): Promise<boolean> {
  await db("delete from pin_attempts where attempted_at < now() - interval '1 day'");
  await db("insert into pin_attempts (ip) values ($1)", [ip]);
  const [c] = await db(
    `select count(*) filter (where ip = $1 and attempted_at > now() - interval '15 minutes')::int as ip_count,
            count(*)::int as site_count
       from pin_attempts
      where attempted_at > now() - interval '1 hour'`,
    [ip],
  );
  return Number(c.ip_count) <= PIN_LIMITS.perIpPer15Min && Number(c.site_count) <= PIN_LIMITS.sitewidePerHour;
}
