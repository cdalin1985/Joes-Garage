import { createClient } from "@/lib/supabase/server";
import { getProfile, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * One-click CSV backup of the shop's data (owner/admin only).
 * GET /api/export/customers → customers-2026-07-06.csv
 * RLS still applies — the query runs as the signed-in user.
 */
const EXPORTS: Record<string, { table: string; order: string }> = {
  customers: { table: "customers", order: "created_at" },
  vehicles: { table: "vehicles", order: "created_at" },
  estimates: { table: "estimates", order: "issue_date" },
  invoices: { table: "invoices", order: "issue_date" },
  payments: { table: "payments", order: "paid_at" },
  "work-orders": { table: "work_orders", order: "created_at" },
  expenses: { table: "expenses", order: "expense_date" },
  parts: { table: "parts", order: "name" },
};

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  // Union of keys across all rows so sparse columns aren't dropped.
  const cols: string[] = [];
  for (const row of rows) for (const k of Object.keys(row)) if (!cols.includes(k)) cols.push(k);
  const lines = [cols.join(",")];
  for (const row of rows) lines.push(cols.map((c) => csvCell(row[c])).join(","));
  return lines.join("\r\n") + "\r\n";
}

export async function GET(_req: Request, { params }: { params: { entity: string } }) {
  const profile = await getProfile();
  if (!profile) return new Response("Sign in required", { status: 401 });
  if (!isAdmin(profile)) return new Response("Owner/Admin only", { status: 403 });

  const spec = EXPORTS[params.entity];
  if (!spec) return new Response("Unknown export", { status: 404 });

  const supabase = createClient();
  const { data, error } = await supabase.from(spec.table).select("*").order(spec.order);
  if (error) return new Response(`Export failed: ${error.message}`, { status: 500 });

  const rows = (data as Record<string, unknown>[]) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.entity}-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
