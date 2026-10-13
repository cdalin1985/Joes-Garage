import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addAsset, deleteAsset } from "@/lib/actions/tax";
import { PageHeader, Card, Stat, SectionTitle, Alert, Field, DataTable, EmptyState, Badge } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ASSET_CATEGORIES } from "@/lib/constants";
import { firstYearDepreciation, TAX_YEAR } from "@/lib/tax";
import type { AssetPurchase } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AssetsPage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const year = parseInt(searchParams.year ?? `${TAX_YEAR}`, 10);
  const supabase = createClient();
  const { data } = await supabase
    .from("asset_purchases")
    .select("*")
    .gte("purchase_date", `${year}-01-01`)
    .lte("purchase_date", `${year}-12-31`)
    .order("purchase_date", { ascending: false });
  const assets = (data as AssetPurchase[]) ?? [];

  const totalCost = assets.reduce((s, a) => s + a.cost, 0);
  const totalWriteoff = assets.reduce((s, a) => s + firstYearDepreciation(a), 0);
  const section179 = assets.filter((a) => a.section_179 || a.bonus_depreciation).reduce((s, a) => s + firstYearDepreciation(a), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Equipment & Depreciation" subtitle={`${year} capital purchases — lifts, tools, computers, vehicles`} backHref="/accounting/tax" />

      <Alert tone="blue" title="Big purchases are deductible — usually all at once">
        Buy a $12,000 lift or a $3,000 scan tool and <strong>Section 179</strong> often lets you
        write off the entire cost the year you buy it instead of spreading it over years. Log every
        capital purchase here and we&apos;ll carry the deduction onto Schedule C line 13 (Form 4562).
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label={`${year} equipment purchased`} value={formatCurrency(totalCost)} />
        <Stat label="First-year write-off" value={formatCurrency(totalWriteoff)} tone="green" hint="Flows to line 13" />
        <Stat label="Via Section 179 / bonus" value={formatCurrency(section179)} tone="blue" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle>Add equipment</SectionTitle>
          <form action={addAsset} className="space-y-3">
            <Field label="Description">
              <input name="description" className="input" placeholder="2-post car lift" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select name="category" defaultValue="tools" className="input" id="cat">
                  {Object.entries(ASSET_CATEGORIES).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Purchase date">
                <input type="date" name="purchase_date" defaultValue={today} className="input" required />
              </Field>
              <Field label="Cost">
                <input type="number" step="0.01" name="cost" className="input" required />
              </Field>
              <Field label="Business use %" hint="100 if shop-only">
                <input type="number" name="business_use_pct" defaultValue={100} className="input" />
              </Field>
            </div>
            <Field label="Recovery period (years)" hint="Tools 7 · vehicles/computers 5 · building 39">
              <input type="number" name="recovery_years" defaultValue={7} className="input" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="section_179" defaultChecked className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              Expense fully this year (Section 179)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="bonus_depreciation" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              Use bonus depreciation instead
            </label>
            <button className="btn-primary w-full">Add asset</button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          {assets.length === 0 ? (
            <EmptyState title={`No equipment logged for ${year}`} description="Record capital purchases to capture the write-off and build your depreciation schedule." />
          ) : (
            <DataTable head={<tr><th>Date</th><th>Item</th><th>Category</th><th className="text-right">Cost</th><th className="text-right">Yr-1 write-off</th><th /></tr>}>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.purchase_date)}</td>
                  <td className="font-medium text-slate-700">
                    {a.description}
                    {(a.section_179 || a.bonus_depreciation) && <Badge tone="green">{a.section_179 ? "§179" : "bonus"}</Badge>}
                  </td>
                  <td className="text-slate-500">{ASSET_CATEGORIES[a.category]?.label ?? a.category}</td>
                  <td className="text-right tabular-nums">{formatCurrency(a.cost)}</td>
                  <td className="text-right tabular-nums text-emerald-600">{formatCurrency(firstYearDepreciation(a))}</td>
                  <td className="text-right"><DeleteButton action={deleteAsset.bind(null, a.id)} iconOnly className="btn-ghost p-1.5" /></td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </div>
    </div>
  );
}
