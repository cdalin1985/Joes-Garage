import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/shop-knowledge";
import { getDb } from "@/lib/db";
import { createWebRequest, findOpenSlots, nowForAssistant, type RequestResult } from "@/lib/booking";
import { site } from "@/lib/site-config";

/**
 * POST /api/assistant — the website's chat + booking assistant.
 *
 * Body: { messages: [{ role: "user" | "assistant", content: string }, ...] }
 * (plain text turns, starting and ending with the user). Runs Claude with two
 * tools (check_availability, request_appointment) until it has a reply.
 * Returns { reply, booking? } or { error } with a status code.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Haiku 5.5: fast and low-cost. It has no server-side refusal fallback, so a
// refusal is handled below with a "please call" reply.
const MODEL = "claude-haiku-5-5";
const MAX_TOOL_ROUNDS = 6;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(40),
});

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "check_availability",
    description:
      "Look up open drop-off times in the shop's appointment book. Returns each day in the range with its open times (24h HH:MM plus a friendly label). Closed days and full slots are omitted from times.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "First day to check, YYYY-MM-DD in shop-local time." },
        days: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7], description: "How many days to check from start_date." },
      },
      required: ["start_date", "days"],
      additionalProperties: false,
    },
  },
  {
    name: "request_appointment",
    description:
      "Save an appointment request in the shop's appointment book for Joe to confirm. Only call after the customer has confirmed the details and the time came from check_availability. Use an empty string for anything optional they didn't give.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Customer's name." },
        phone: { type: "string", description: "US phone number the shop can call or text." },
        email: { type: "string", description: "Email, or empty string." },
        vehicle_year: { type: "string", description: "4-digit year, or empty string." },
        vehicle_make: { type: "string", description: "e.g. Ford, or empty string." },
        vehicle_model: { type: "string", description: "e.g. F-150, or empty string." },
        concern: { type: "string", description: "What's going on with the vehicle, in the customer's words." },
        date: { type: "string", description: "YYYY-MM-DD (shop-local)." },
        time: { type: "string", description: "HH:MM 24h, exactly as returned by check_availability." },
        notes: { type: "string", description: "Anything else useful, or empty string." },
      },
      required: [
        "name",
        "phone",
        "email",
        "vehicle_year",
        "vehicle_make",
        "vehicle_model",
        "concern",
        "date",
        "time",
        "notes",
      ],
      additionalProperties: false,
    },
  },
];

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const AvailabilityInput = z.object({ start_date: DateStr, days: z.number().int().min(1).max(7) });
const RequestInput = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, ""))
    .pipe(z.string().length(10)),
  email: z.union([z.literal(""), z.string().trim().email().max(120)]),
  vehicle_year: z.string().trim().max(4),
  vehicle_make: z.string().trim().max(40),
  vehicle_model: z.string().trim().max(60),
  concern: z.string().trim().min(2).max(600),
  date: DateStr,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(600),
});

// Best-effort per-instance limiter (serverless instances don't share memory;
// the booking code also enforces limits in the database).
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 40;
}

type ToolOutcome = { content: string; isError?: boolean; booking?: Extract<RequestResult, { ok: true }> };

async function runTool(name: string, input: unknown): Promise<ToolOutcome> {
  const db = getDb();
  if (!db) {
    return {
      content: `Online booking isn't switched on yet. Ask the customer to call ${site.phone} to book.`,
      isError: true,
    };
  }
  if (name === "check_availability") {
    const parsed = AvailabilityInput.safeParse(input);
    if (!parsed.success) return { content: "Invalid input: start_date must be YYYY-MM-DD and days 1-7.", isError: true };
    const days = await findOpenSlots(db, parsed.data.start_date, parsed.data.days);
    return { content: JSON.stringify({ days }) };
  }
  if (name === "request_appointment") {
    const parsed = RequestInput.safeParse(input);
    if (!parsed.success) {
      const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      return { content: `Invalid or missing: ${fields}. Ask the customer and try again.`, isError: true };
    }
    const d = parsed.data;
    const result = await createWebRequest(db, {
      name: d.name,
      phone: d.phone,
      email: d.email,
      vehicleYear: d.vehicle_year,
      vehicleMake: d.vehicle_make,
      vehicleModel: d.vehicle_model,
      concern: d.concern,
      date: d.date,
      time: d.time,
      notes: d.notes,
    });
    if (!result.ok) return { content: result.message, isError: true };
    return { content: JSON.stringify(result), booking: result };
  }
  return { content: `Unknown tool ${name}.`, isError: true };
}

const textOf = (content: Anthropic.Beta.BetaContentBlock[]) =>
  content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

/** Browsers send Origin on POST; only this site's own pages may call the assistant. */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false; // e.g. "null" from sandboxed frames
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const history = parsed.data.messages;
  const alternates = history.every((m, i) => m.role === (i % 2 === 0 ? "user" : "assistant"));
  if (!alternates || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  // The clock goes in its own system block after the cache breakpoint, so the
  // cached prompt stays valid. (Sent as a mid-conversation system message, the
  // API accepted it but it had no effect on Haiku 5.5: the live assistant said
  // it didn't know the date.)
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: "text", text: ASSISTANT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: `Right now it is ${nowForAssistant()}.` },
  ];

  let booking: ToolOutcome["booking"];
  let lastText = "";
  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 4096,
        // "medium" (Haiku's default): at "low" it is likelier to skip a tool
        // call, and offering times without checking availability would be wrong.
        output_config: { effort: "medium" },
        system,
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason === "refusal") {
        return NextResponse.json({
          reply: `Sorry — I can't help with that one here. Give the shop a call at ${site.phone}.`,
          booking,
        });
      }
      const text = textOf(response.content);
      if (text) lastText = text;
      if (response.stop_reason !== "tool_use") break;

      messages.push({ role: "assistant", content: response.content });
      const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const use of toolUses) {
        let outcome: ToolOutcome;
        try {
          outcome = await runTool(use.name, use.input);
        } catch (err) {
          console.error("assistant tool failed", use.name, err);
          outcome = { content: `That didn't work on our end. Ask the customer to call ${site.phone}.`, isError: true };
        }
        if (outcome.booking) booking = outcome.booking;
        results.push({ type: "tool_result", tool_use_id: use.id, content: outcome.content, is_error: outcome.isError });
      }
      messages.push({ role: "user", content: results });
    }
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "busy" }, { status: 503 });
    }
    console.error("assistant request failed", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  return NextResponse.json({
    reply: lastText || `Sorry, I lost my train of thought. Try again, or call ${site.phone}.`,
    booking,
  });
}
