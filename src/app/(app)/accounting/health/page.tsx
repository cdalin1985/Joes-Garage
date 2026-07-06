import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Stat, SectionTitle } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAY = 86400000;

type WindowStats = {
  carCount: number;
  billed: number;
  invoiceCount: number;
  avgTicket: number;
  collected: number;
  estimatesDecided: number;
  estimatesWon: number;
  closeRate: number | null;
  laborRevenue: number;
  partsRevenue: number;
  otherRevenue: number;
  partsCost: number;
};

function emptyWindow(): WindowStats {
  return {
    carCount: 0, billed: 0, invoiceCount: 0, avgTicket: 0, collected: 0,
    estimatesDecided: 0, estimatesWon: 0, closeRate: null,
    laborRevenue: 0, partsRevenue: 0, otherRevenue: 0, partsCost: 0,
  };
}

function Delta({ cur, prev, money, invert }: { cur: number; prev: number; money?: boolean; invert?: boolean }) {
  const diff = cur - prev;
  if (Math.abs(diff) < 0.005) return <span className="text-slate-400">even with last period</span>;
  const up = diff > 0;
  const good = invert ? !up : up;
  return (
    <span className={good ? "text-emerald-600" : "text-red-600"}>
      {up ? "▲" : "▼"} {money ? formatCurrency(Math.abs(diff)) : Math.abs(diff).toLocaleString()} vs prior
    </span>
  );
}

function MixBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="tabular-nums text-slate-500">{formatCurrency(value)} · {pct.toFixed(0)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function ShopHealthPage({ searchParams }: { searchParams: { range?: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const days = searchParams.range === "month" ? 30 : 7;
  const rangeWord = days === 7 ? "week" : "month";
  const now = Date.now();
  const curStartDate = new Date(now - days * DAY);
  const prevStartDate = new Date(now - 2 * days * DAY);
  const curStart = curStartDate.toISOString().slice(0, 10);
  const prevStart = prevStartDate.toISOString().slice(0, 10);
  const curStartIso = curStartDate.toISOString();
  const prevStartIso = prevStartDate.toISOString();

  // One query per source spanning both windows; split in JS.
  const [{ data: invData }, { data: payData }, { data: woData }, { data: estData }, { data: itemData }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("issue_date, total, status")
        .gte("issue_date", prevStart)
        .neq("status", "void"),
      supabase.from("payments").select("paid_at, amount").gte("paid_at", prevStart),
      supabase
        .from("work_orders")
        .select("completed_at, status")
        .in("status", ["completed", "delivered"])
        .gte("completed_at", prevStartIso),
      supabase
        .from("estimates")
        .select("issue_date, status")
        .gte("issue_date", prevStart)
        .neq("status", "draft"),
      supabase
        .from("invoice_items")
        .select("item_type, quantity, line_total, part_id, invoices!inner(issue_date, status)")
        .gte("invoices.issue_date", prevStart)
        .neq("invoices.status", "void"),
    ]);

  type ItemRow = {
    item_type: string;
    quantity: number;
    line_total: number;
    part_id: string | null;
    invoices: { issue_date: string; status: string } | null;
  };
  const items = (itemData as unknown as ItemRow[]) ?? [];

  // Part costs for margin math.
  const partIds = [...new Set(items.map((i) => i.part_id).filter((id): id is string => !!id))];
  const costById = new Map<string, number>();
  if (partIds.length > 0) {
    const { data: partData } = await supabase.from("parts").select("id, cost").in("id", partIds);
    for (const p of (partData as { id: string; cost: number }[]) ?? []) costById.set(p.id, p.cost);
  }

  const cur = emptyWindow();
  const prev = emptyWindow();

  for (const i of (invData as { issue_date: string; total: number }[]) ?? []) {
    const w = i.issue_date >= curStart ? cur : prev;
    w.billed += i.total ?? 0;
    w.invoiceCount += 1;
  }
  for (const p of (payData as { paid_at: string; amount: number }[]) ?? []) {
    (p.paid_at >= curStart ? cur : prev).collected += p.amount ?? 0;
  }
  for (const w of (woData as { completed_at: string | null }[]) ?? []) {
    if (!w.completed_at) continue;
    (w.completed_at >= curStartIso ? cur : prev).carCount += 1;
  }
  for (const e of (estData as { issue_date: string; status: string }[]) ?? []) {
    const w = e.issue_date >= curStart ? cur : prev;
    if (["approved", "declined", "expired", "converted"].includes(e.status)) {
      w.estimatesDecided += 1;
      if (e.status === "approved" || e.status === "converted") w.estimatesWon += 1;
    }
  }
  for (const it of items) {
    const d = it.invoices?.issue_date;
    if (!d) continue;
    const w = d >= curStart ? cur : prev;
    if (it.item_type === "labor") w.laborRevenue += it.line_total;
    else if (it.item_type === "part") {
      w.partsRevenue += it.line_total;
      const cost = it.part_id ? costById.get(it.part_id) : undefined;
      if (cost != null) w.partsCost += cost * it.quantity;
    } else w.otherRevenue += it.line_total;
  }
  for (const w of [cur, prev]) {
    w.avgTicket = w.invoiceCount > 0 ? w.billed / w.invoiceCount : 0;
    w.closeRate = w.estimatesDecided > 0 ? w.estimatesWon / w.estimatesDecided : null;
  }

  const mixTotal = cur.laborRevenue + cur.partsRevenue + cur.otherRevenue;
  const partsMargin = cur.partsRevenue > 0 && cur.partsCost > 0
    ? (cur.partsRevenue - cur.partsCost) / cur.partsRevenue
    : null;
  const collectGap = cur.billed - cur.collected;

  // Plain-English readout.
  const insights: { text: string; tone: "good" | "bad" | "flat" }[] = [];
  const carDiff = cur.carCount - prev.carCount;
  insights.push({
    text:
      carDiff === 0
        ? `You finished ${cur.carCount} car${cur.carCount === 1 ? "" : "s"} this ${rangeWord} — same as the ${rangeWord} before.`
        : `You finished ${cur.carCount} car${cur.carCount === 1 ? "" : "s"} this ${rangeWord}, ${Math.abs(carDiff)} ${carDiff > 0 ? "more" : "fewer"} than the ${rangeWord} before.`,
    tone: carDiff > 0 ? "good" : carDiff < 0 ? "bad" : "flat",
  });
  if (cur.invoiceCount > 0) {
    const aroDiff = cur.avgTicket - prev.avgTicket;
    insights.push({
      text: prev.invoiceCount === 0
        ? `Your average invoice was ${formatCurrency(cur.avgTicket)}.`
        : `Your average invoice was ${formatCurrency(cur.avgTicket)} — ${formatCurrency(Math.abs(aroDiff))} ${aroDiff >= 0 ? "higher" : "lower"} than the ${rangeWord} before. ${aroDiff < 0 ? "Look at whether recommended work is being declined (see Follow-Ups)." : "Nice — keep presenting the full inspection findings."}`,
      tone: aroDiff >= 0 ? "good" : "bad",
    });
  }
  if (cur.closeRate != null) {
    insights.push({
      text: `You won ${cur.estimatesWon} of ${cur.estimatesDecided} decided estimates (${(cur.closeRate * 100).toFixed(0)}%). ${cur.closeRate < 0.5 ? "Under half — worth a follow-up call before a customer walks." : "That's a healthy close rate."}`,
      tone: cur.closeRate >= 0.5 ? "good" : "bad",
    });
  }
  if (cur.billed > 0) {
    insights.push({
      text:
        collectGap > 0.005
          ? `You billed ${formatCurrency(cur.billed)} but collected ${formatCurrency(cur.collected)} — ${formatCurrency(collectGap)} is still out there. The Follow-Ups page lists who to call.`
          : `You collected ${formatCurrency(cur.collected)} against ${formatCurrency(cur.billed)} billed — cash is keeping up with the work.`,
      tone: collectGap > 0.005 ? "bad" : "good",
    });
  }
  if (partsMargin != null) {
    insights.push({
      text: `Parts carried a ${(partsMargin * 100).toFixed(0)}% margin this ${rangeWord}. ${partsMargin < 0.35 ? "That's thin for an independent shop — check the Pricing Matrix brackets." : "Right in a healthy range for an independent shop."}`,
      tone: partsMargin >= 0.35 ? "good" : "bad",
    });
  }

  const TONE_DOT = { good: "bg-emerald-500", bad: "bg-red-500", flat: "bg-slate-300" } as const;

  return (
    <div>
      <PageHeader
        title="Shop Health"
        subtitle={`How the last ${days} days went, in plain English`}
        backHref="/accounting"
        actions={<PrintButton label="Print report" />}
      />

      <div className="mb-4 flex gap-2 print:hidden">
        <Link href="/accounting/health" className={`rounded-full px-3 py-1 text-sm ${days === 7 ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
          Last 7 days
        </Link>
        <Link href="/accounting/health?range=month" className={`rounded-full px-3 py-1 text-sm ${days === 30 ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
          Last 30 days
        </Link>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cars finished" value={cur.carCount} />
        <Stat label="Billed" value={formatCurrency(cur.billed)} tone="blue" />
        <Stat label="Collected" value={formatCurrency(cur.collected)} tone="green" />
        <Stat label="Average invoice" value={formatCurrency(cur.avgTicket)} tone="slate" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle>What changed</SectionTitle>
          <ul className="space-y-3">
            {insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[ins.tone]}`} />
                <p className="text-sm text-slate-700">{ins.text}</p>
              </li>
            ))}
            {insights.length <= 1 && cur.invoiceCount === 0 && (
              <li className="text-sm text-slate-400">Not much activity recorded in this window yet — these read-outs sharpen as invoices, payments, and estimates flow through the app.</li>
            )}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Where the revenue came from</SectionTitle>
          {mixTotal === 0 ? (
            <p className="py-3 text-center text-sm text-slate-400">No invoiced items this {rangeWord}.</p>
          ) : (
            <div className="space-y-3">
              <MixBar label="Labor" value={cur.laborRevenue} total={mixTotal} tone="bg-brand-500" />
              <MixBar label="Parts" value={cur.partsRevenue} total={mixTotal} tone="bg-accent-500" />
              {cur.otherRevenue > 0 && <MixBar label="Fees & other" value={cur.otherRevenue} total={mixTotal} tone="bg-slate-400" />}
              {partsMargin != null && (
                <p className="pt-1 text-xs text-slate-500">
                  Parts margin: <span className="font-semibold text-slate-700">{(partsMargin * 100).toFixed(0)}%</span>{" "}
                  <Link href="/parts/pricing-matrix" className="text-brand-600 hover:underline print:hidden">pricing matrix →</Link>
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <SectionTitle>Side by side</SectionTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2">Metric</th>
              <th className="py-2 text-right">This {rangeWord}</th>
              <th className="py-2 text-right">Prior {rangeWord}</th>
              <th className="py-2 text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2 text-slate-600">Cars finished</td>
              <td className="py-2 text-right tabular-nums">{cur.carCount}</td>
              <td className="py-2 text-right tabular-nums text-slate-500">{prev.carCount}</td>
              <td className="py-2 text-right text-xs"><Delta cur={cur.carCount} prev={prev.carCount} /></td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 text-slate-600">Billed</td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(cur.billed)}</td>
              <td className="py-2 text-right tabular-nums text-slate-500">{formatCurrency(prev.billed)}</td>
              <td className="py-2 text-right text-xs"><Delta cur={cur.billed} prev={prev.billed} money /></td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 text-slate-600">Collected</td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(cur.collected)}</td>
              <td className="py-2 text-right tabular-nums text-slate-500">{formatCurrency(prev.collected)}</td>
              <td className="py-2 text-right text-xs"><Delta cur={cur.collected} prev={prev.collected} money /></td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 text-slate-600">Average invoice</td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(cur.avgTicket)}</td>
              <td className="py-2 text-right tabular-nums text-slate-500">{formatCurrency(prev.avgTicket)}</td>
              <td className="py-2 text-right text-xs"><Delta cur={cur.avgTicket} prev={prev.avgTicket} money /></td>
            </tr>
            <tr>
              <td className="py-2 text-slate-600">Estimate close rate</td>
              <td className="py-2 text-right tabular-nums">{cur.closeRate != null ? `${(cur.closeRate * 100).toFixed(0)}%` : "—"}</td>
              <td className="py-2 text-right tabular-nums text-slate-500">{prev.closeRate != null ? `${(prev.closeRate * 100).toFixed(0)}%` : "—"}</td>
              <td className="py-2 text-right text-xs">
                {cur.closeRate != null && prev.closeRate != null ? <Delta cur={cur.closeRate * 100} prev={prev.closeRate * 100} /> : <span className="text-slate-300">—</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <p className="mt-4 text-xs text-slate-400 print:hidden">
        Rolling windows: today back {days} days, compared against the {days} days before that. "Cars finished" counts
        work orders marked completed or delivered; billed/collected are cash-basis like the rest of the books.
      </p>
    </div>
  );
}
