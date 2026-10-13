import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxYearData } from "@/lib/tax-data";
import { PageHeader, Card, Stat, SectionTitle, Alert, Badge } from "@/components/ui";
import { IconReport, IconCalculator, IconCar, IconUsers, IconPackage, IconSettings, IconChevronRight } from "@/components/icons";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ENTITY_TYPES } from "@/lib/constants";
import { estimatedDueDates, TAX_YEAR } from "@/lib/tax";

export const dynamic = "force-dynamic";

export default async function TaxCenterPage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const year = parseInt(searchParams.year ?? `${TAX_YEAR}`, 10);
  const supabase = createClient();
  const [d, { data: vendorData }, { data: vExpData }] = await Promise.all([
    getTaxYearData(year),
    supabase.from("vendors").select("id, is_1099, tax_id, w9_on_file"),
    supabase
      .from("expenses")
      .select("vendor_id, amount, payment_method")
      .gte("expense_date", `${year}-01-01`)
      .lte("expense_date", `${year}-12-31`),
  ]);
  const { profile, liability, estimate } = d;

  const entity = ENTITY_TYPES[profile.entity_type];
  const remainingFederal = Math.max(estimate.requiredAnnual - d.paidFederal, 0);

  // 1099 readiness: any contractor over $600 (non-card) still missing a W-9 / tax ID?
  const vendors1099 = (vendorData as { id: string; is_1099: boolean; tax_id: string | null; w9_on_file: boolean }[]) ?? [];
  const nonCardByVendor = new Map<string, number>();
  for (const e of ((vExpData as { vendor_id: string | null; amount: number; payment_method: string | null }[]) ?? [])) {
    if (!e.vendor_id || e.payment_method === "card") continue;
    nonCardByVendor.set(e.vendor_id, (nonCardByVendor.get(e.vendor_id) ?? 0) + e.amount);
  }
  const contractors1099Ready = !vendors1099.some(
    (v) => v.is_1099 && (nonCardByVendor.get(v.id) ?? 0) >= 600 && (!v.tax_id || !v.w9_on_file),
  );

  // Readiness checklist — nudges the owner toward a complete, audit-proof file.
  const checklist = [
    { ok: !!profile.ein || profile.entity_type === "sole_prop", label: "Business identity & EIN on file", href: "/accounting/tax/profile" },
    { ok: profile.prior_year_total_tax > 0, label: "Last year's tax entered (drives safe-harbor)", href: "/accounting/tax/profile" },
    { ok: d.scheduleC.totalExpenses > 0, label: "Expenses categorized for Schedule C", href: "/accounting" },
    { ok: d.estimatedPayments.length > 0, label: "Quarterly estimated payments tracked", href: "/accounting/tax/estimated" },
    { ok: !profile.has_home_office || profile.home_office_sqft > 0, label: "Home office measured (if used)", href: "/accounting/tax/profile" },
    { ok: d.vehicle.deduction > 0 || profile.vehicle_method === "actual", label: "Business mileage logged", href: "/accounting/tax/mileage" },
    { ok: contractors1099Ready, label: "Contractors over $600 have a W-9 on file", href: "/accounting/tax/contractors" },
  ];
  const done = checklist.filter((c) => c.ok).length;

  const tools = [
    { href: "/accounting/tax/profile", icon: <IconSettings className="h-5 w-5" />, title: "Business & Tax Profile", desc: "The full intake an accountant would ask for — entity, household, home office, vehicle, retirement." },
    { href: "/accounting/tax/schedule-c", icon: <IconReport className="h-5 w-5" />, title: "Schedule C (auto-filled)", desc: "Your Form 1040 Schedule C, every line filled from your books. Printable." },
    { href: "/accounting/tax/estimated", icon: <IconCalculator className="h-5 w-5" />, title: "Quarterly Estimated Taxes", desc: "What to send the IRS each quarter so you never owe a penalty." },
    { href: "/accounting/tax/mileage", icon: <IconCar className="h-5 w-5" />, title: "Mileage Log", desc: "IRS-compliant trip log at 70¢/mile for 2025." },
    { href: "/accounting/tax/assets", icon: <IconPackage className="h-5 w-5" />, title: "Equipment & Depreciation", desc: "Lifts, tools, computers — track Section 179 write-offs." },
    { href: "/accounting/tax/contractors", icon: <IconUsers className="h-5 w-5" />, title: "1099 Contractors", desc: "Who needs a 1099-NEC, with W-9 tracking and auto totals." },
  ];

  return (
    <div>
      <PageHeader
        title="Tax Center"
        subtitle={`Over-prepared for ${year}. Files as ${entity.form}.`}
        backHref="/accounting"
        actions={
          <>
            <Link href={`/accounting/tax/packet?year=${year}`} className="btn-secondary">
              Year-end packet
            </Link>
            <Link href="/accounting/tax/schedule-c" className="btn-primary">
              View Schedule C
            </Link>
          </>
        }
      />

      <Alert tone="blue" title="How this works">
        Every figure below is built automatically from the invoices, payments, and expenses you
        already record — then run through current-year (2025) IRS rules. Fill out your{" "}
        <Link href="/accounting/tax/profile" className="font-semibold underline">tax profile</Link>{" "}
        once and the whole center sharpens. These are planning estimates; confirm with a tax pro
        before filing.
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`${year} net profit`} value={formatCurrency(d.scheduleC.netProfit)} tone={d.scheduleC.netProfit >= 0 ? "green" : "red"} icon={<IconReport className="h-5 w-5" />} hint="Schedule C line 31" />
        <Stat label="Projected total tax" value={formatCurrency(liability.totalTax)} tone="amber" icon={<IconCalculator className="h-5 w-5" />} hint={`Income tax + SE tax · ${formatPercent(liability.effectiveRate)} effective`} />
        <Stat label="Set aside per quarter" value={formatCurrency(estimate.perQuarter)} tone="blue" icon={<IconCalculator className="h-5 w-5" />} hint={estimate.safeHarborBasis} />
        <Stat label="Still owed this year" value={formatCurrency(remainingFederal)} tone={remainingFederal > 0 ? "red" : "green"} icon={<IconInvoiceLike />} hint={`${formatCurrency(d.paidFederal)} paid so far`} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle action={<Badge tone={done === checklist.length ? "green" : "amber"}>{done}/{checklist.length} ready</Badge>}>
            Tax-time readiness
          </SectionTitle>
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-3 rounded-xl border border-slate-200/70 px-3 py-2.5 transition hover:border-brand-300 hover:bg-accent-50/40">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {c.ok ? "✓" : "•"}
                  </span>
                  <span className={`flex-1 text-sm ${c.ok ? "text-slate-700" : "font-medium text-slate-800"}`}>{c.label}</span>
                  <IconChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>{year} estimated due dates</SectionTitle>
          <ul className="space-y-2.5">
            {estimatedDueDates(year).map((q) => {
              const paid = d.estimatedPayments
                .filter((p) => p.quarter === q.quarter && p.jurisdiction === "federal")
                .reduce((s, p) => s + p.amount, 0);
              return (
                <li key={q.quarter} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-slate-700">{q.label}</span>
                    <span className="ml-2 text-xs text-slate-400">due {q.due}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium tabular-nums text-slate-700">{formatCurrency(estimate.perQuarter)}</span>
                    {paid > 0 && <Badge tone="green">paid</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
          <Link href="/accounting/tax/estimated" className="btn-secondary mt-4 w-full justify-center">
            Record a payment
          </Link>
        </Card>
      </div>

      <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-slate-500">Tools</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift">
            <span className="icon-chip mb-3 h-11 w-11 transition-transform duration-200 group-hover:scale-110">{t.icon}</span>
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              {t.title}
              <IconChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </span>
            <span className="mt-1 text-sm text-slate-500">{t.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function IconInvoiceLike() {
  return <IconCalculator className="h-5 w-5" />;
}
