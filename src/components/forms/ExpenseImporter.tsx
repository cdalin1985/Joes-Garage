"use client";

import { useMemo, useState } from "react";
import type { ExpenseCategory } from "@/lib/database.types";

type ParsedRow = {
  include: boolean;
  date: string;
  description: string;
  amount: number;
  categoryId: string;
};

/** Keyword → category-name hints for auto-suggesting a Schedule-C bucket. */
const CATEGORY_HINTS: { keywords: string[]; match: string[] }[] = [
  { keywords: ["napa", "autozone", "advance auto", "oreilly", "o'reilly", "rockauto", "parts"], match: ["parts", "cost of goods", "supplies"] },
  { keywords: ["shell", "chevron", "exxon", "bp ", "fuel", "gas station", "marathon", "76 ", "circle k"], match: ["car and truck", "vehicle", "fuel"] },
  { keywords: ["state farm", "geico", "progressive", "insurance", "liberty mutual"], match: ["insurance"] },
  { keywords: ["verizon", "at&t", "comcast", "spectrum", "internet", "phone"], match: ["utilities", "telephone", "office"] },
  { keywords: ["electric", "power", "water", "utility", "gas company"], match: ["utilities"] },
  { keywords: ["facebook", "google ads", "yelp", "advertis", "marketing"], match: ["advertising"] },
  { keywords: ["staples", "office depot", "amzn", "amazon", "office"], match: ["office", "supplies"] },
  { keywords: ["rent", "lease", "property mgmt"], match: ["rent"] },
  { keywords: ["snap-on", "snapon", "matco", "tool"], match: ["supplies", "small tools", "equipment"] },
  { keywords: ["quickbooks", "intuit", "software", "adobe", "subscription"], match: ["office", "dues", "software"] },
];

function suggestCategory(description: string, categories: ExpenseCategory[]): string {
  const desc = description.toLowerCase();
  for (const hint of CATEGORY_HINTS) {
    if (hint.keywords.some((k) => desc.includes(k))) {
      const cat = categories.find((c) => hint.match.some((m) => c.name.toLowerCase().includes(m)));
      if (cat) return cat.id;
    }
  }
  return "";
}

/** Minimal CSV parser that handles quoted fields and commas inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((c) => c.trim() !== "")) rows.push(row); }
  return rows;
}

function findCol(headers: string[], names: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const n of names) {
    const idx = lower.findIndex((h) => h === n || h.includes(n));
    if (idx !== -1) return idx;
  }
  return -1;
}

function normalizeDate(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/); // M/D/Y
  if (m) {
    let [, mo, da, yr] = m;
    if (yr.length === 2) yr = `20${yr}`;
    return `${yr}-${mo.padStart(2, "0")}-${da.padStart(2, "0")}`;
  }
  return s;
}

export function ExpenseImporter({ action, categories }: { action: (fd: FormData) => void; categories: ExpenseCategory[] }) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const table = parseCsv(String(reader.result));
        if (table.length < 2) { setError("That file didn't have any data rows."); return; }
        const headers = table[0];
        const dateCol = findCol(headers, ["date", "transaction date", "posted date"]);
        const descCol = findCol(headers, ["description", "name", "memo", "payee", "details"]);
        const amtCol = findCol(headers, ["amount", "debit", "withdrawal"]);
        if (dateCol === -1 || amtCol === -1) {
          setError("Couldn't find Date and Amount columns. Most bank exports have them — try the CSV download.");
          return;
        }
        const parsed: ParsedRow[] = [];
        for (const r of table.slice(1)) {
          const rawAmt = (r[amtCol] ?? "").replace(/[$,()]/g, "").trim();
          let amount = parseFloat(rawAmt);
          if (isNaN(amount)) continue;
          // Statements show charges as negative; treat outflow as a positive expense, skip deposits.
          if (amount < 0) amount = Math.abs(amount);
          else if (/credit|deposit|payment received/i.test(r[descCol] ?? "")) continue;
          const description = (descCol !== -1 ? r[descCol] : "").trim();
          parsed.push({
            include: true,
            date: normalizeDate(r[dateCol] ?? ""),
            description,
            amount,
            categoryId: suggestCategory(description, categories),
          });
        }
        if (parsed.length === 0) { setError("No expense rows found (deposits and credits are skipped)."); return; }
        setRows(parsed);
      } catch {
        setError("Couldn't read that file. Make sure it's a CSV export from your bank.");
      }
    };
    reader.readAsText(file);
  }

  function update(i: number, patch: Partial<ParsedRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const selected = rows.filter((r) => r.include);
  const total = useMemo(() => selected.reduce((s, r) => s + (r.amount || 0), 0), [selected]);

  const payloadRows = selected.map((r) => ({
    expense_date: r.date,
    vendor_name: r.description.slice(0, 120),
    description: r.description,
    amount: r.amount,
    category_id: r.categoryId || null,
    payment_method: "card" as const,
  }));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <input id="csv" type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
        <label htmlFor="csv" className="btn-primary inline-flex cursor-pointer">Choose a statement CSV…</label>
        <p className="mt-2 text-xs text-slate-400">
          Export transactions from your bank or credit-card site as CSV. We auto-detect date, description, and amount.
          Deposits and credits are skipped automatically.
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {rows.length > 0 && (
        <form action={action} className="space-y-4">
          <input type="hidden" name="rows" value={JSON.stringify(payloadRows)} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{selected.length}</span> of {rows.length} rows selected ·{" "}
              <span className="font-semibold text-slate-700">${total.toFixed(2)}</span> total
            </p>
            <button type="submit" disabled={selected.length === 0} className="btn-primary disabled:opacity-50">
              Import {selected.length} expense{selected.length === 1 ? "" : "s"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-slate-100 ${r.include ? "" : "opacity-40"}`}>
                    <td className="px-3 py-1.5">
                      <input type="checkbox" checked={r.include} onChange={(e) => update(i, { include: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="date" value={r.date} onChange={(e) => update(i, { date: e.target.value })} className="input !py-1 !text-xs" />
                    </td>
                    <td className="px-3 py-1.5">
                      <input value={r.description} onChange={(e) => update(i, { description: e.target.value })} className="input !py-1 !text-xs w-full min-w-[180px]" />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <input type="number" step="0.01" value={r.amount} onChange={(e) => update(i, { amount: parseFloat(e.target.value) || 0 })} className="input !py-1 !text-xs w-24 text-right" />
                    </td>
                    <td className="px-3 py-1.5">
                      <select value={r.categoryId} onChange={(e) => update(i, { categoryId: e.target.value })} className="input !py-1 !text-xs">
                        <option value="">— uncategorized —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">
            Review categories before importing — they decide which Schedule C line each expense lands on. You can edit
            any expense afterward under Accounting.
          </p>
        </form>
      )}
    </div>
  );
}
