/**
 * Emails the shop when someone requests an appointment online, so a request
 * never sits unseen on the /requests page. Sent through Resend's HTTP API
 * (no SDK). Server-only — RESEND_API_KEY must never reach the browser.
 *
 * Without a verified domain, Resend's onboarding@resend.dev sender can only
 * deliver to the address the Resend account was created with, so that
 * account should be the shop's inbox (BOOKING_ALERT_TO, default site.email).
 * Once a domain is verified in Resend, set BOOKING_ALERT_FROM to an address
 * on it. Unset RESEND_API_KEY turns alerts off; the request is still saved.
 */

import { site } from "@/lib/site-config";

export type NewRequest = {
  ref: string;
  when: string;
  name: string;
  phone: string; // 10 digits
  email: string;
  vehicle: string;
  concern: string;
  notes: string;
};

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = `${site.name} website <onboarding@resend.dev>`;
/** The chat reply waits on this, so don't let a slow mail API hold it up. */
const TIMEOUT_MS = 5000;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** One line, no control characters: customer text goes into the subject. */
const oneLine = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);

export const prettyPhone = (digits: string) =>
  digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : digits;

/** Subject, plain text and HTML for one request. */
export function requestEmail(r: NewRequest) {
  const requestsUrl = `${site.url}/requests`;
  const phone = prettyPhone(r.phone);
  const rows: [string, string][] = [
    ["When", r.when],
    ["Name", r.name],
    ["Phone", phone],
    ["Email", r.email || "—"],
    ["Vehicle", r.vehicle || "—"],
    ["Concern", r.concern],
    ...(r.notes ? ([["Notes", r.notes]] as [string, string][]) : []),
    ["Reference", r.ref],
  ];

  const subject = oneLine(`New appointment request: ${r.when} – ${r.name}`, 150);
  const text = [
    "Someone requested an appointment on the website.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Confirm or decline it here: ${requestsUrl}`,
    "Nothing is booked until you confirm it.",
  ].join("\n");

  const cell = (v: string) => escapeHtml(v).replace(/\n/g, "<br>");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5">
<p style="margin:0 0 12px">Someone requested an appointment on the website.</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
${rows
  .map(([k, v]) => {
    const value = k === "Phone" ? `<a href="tel:+1${r.phone}">${cell(v)}</a>` : cell(v);
    return `<tr><td style="color:#666;vertical-align:top;white-space:nowrap">${k}</td><td><strong>${value}</strong></td></tr>`;
  })
  .join("\n")}
</table>
<p style="margin:16px 0 4px"><a href="${requestsUrl}" style="display:inline-block;background:#c20a12;color:#fff;text-decoration:none;font-weight:bold;padding:10px 16px;border-radius:8px">Confirm or decline</a></p>
<p style="margin:8px 0 0;color:#666;font-size:13px">Nothing is booked until you confirm it.</p>
</div>`;

  return { subject, text, html };
}

/** Sends the alert. Never throws: a failed email must not fail the booking. */
export async function emailNewRequest(r: NewRequest): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const { subject, text, html } = requestEmail(r);
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.BOOKING_ALERT_FROM || DEFAULT_FROM,
        to: [process.env.BOOKING_ALERT_TO || site.email],
        subject,
        text,
        html,
        // Hitting Reply answers the customer directly.
        ...(r.email ? { reply_to: r.email } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`Booking alert email failed (${res.status}):`, (await res.text()).slice(0, 300));
  } catch (err) {
    console.error("Booking alert email failed:", err);
  }
}
