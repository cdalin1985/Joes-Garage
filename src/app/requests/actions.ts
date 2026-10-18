"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb, isUniqueViolation } from "@/lib/db";
import { REQUESTS_COOKIE, REQUESTS_PATH, isUnlocked, pinMatches, unlockToken } from "@/lib/requests-auth";

/** Server actions for Joe's booking-requests page. Every action re-checks the PIN cookie. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["requested", "confirmed", "declined", "cancelled"]);

export async function unlock(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  if (!pinMatches(pin)) {
    await new Promise((r) => setTimeout(r, 1000)); // slow down guessing
    redirect(`${REQUESTS_PATH}?e=pin`);
  }
  cookies().set(REQUESTS_COOKIE, unlockToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REQUESTS_PATH,
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(REQUESTS_PATH);
}

export async function lock() {
  cookies().set(REQUESTS_COOKIE, "", { path: REQUESTS_PATH, maxAge: 0 });
  redirect(REQUESTS_PATH);
}

export async function setStatus(formData: FormData) {
  if (!isUnlocked()) redirect(REQUESTS_PATH);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const db = getDb();
  if (!db || !UUID.test(id) || !STATUSES.has(status)) redirect(REQUESTS_PATH);

  let slotTaken = false;
  try {
    await db("update booking_requests set status = $2, updated_at = now() where id = $1", [id, status]);
  } catch (err) {
    // Re-opening a request whose slot was since given to someone else.
    if (!isUniqueViolation(err)) throw err;
    slotTaken = true;
  }
  revalidatePath(REQUESTS_PATH);
  redirect(slotTaken ? `${REQUESTS_PATH}?e=slot` : REQUESTS_PATH);
}
