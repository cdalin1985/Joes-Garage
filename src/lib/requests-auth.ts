import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * PIN lock for Joe's /requests page. The PIN lives in the BOOKING_PIN env var
 * (server-only); unlocking sets an httpOnly cookie holding an HMAC derived
 * from the PIN, so changing the PIN signs everyone out.
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
