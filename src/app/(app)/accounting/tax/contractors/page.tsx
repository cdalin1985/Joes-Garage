import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveVendor1099 } from "@/lib/actions/tax";
import { PageHeader, Card, Stat, SectionTitle, Alert, Field, EmptyState, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { TAX_YEAR } from "@/lib/tax";
import type { Vendor, Expense } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const THRESHOLD_1099 = 600;

export default async function ContractorsPage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const year = parseInt(searchParams.year ?? `${TAX_YEAR}`, 10);
  const supabase = createClient();

  const [{ data: vendorData }, { data: expData }] = await Promise.all([
    supabase.from("vendors").select("*").order("name"),
    supabase
      .from("expenses")
      .select("vendor_id, amount, payment_method")
      .gte("expense_date", `${year}-01-01`)
      .lte("expense_date", `${year}-12-31`),
  ]);
  const vendors = (vendorData as Vendor[]) ?? [];
  const expenses = (expData as Pick<Expense, "vendor_id" | "amount" | "payment_method">[]) ?? [];

  // Card/third-party-network payments are reported on 1099-K by the processor,
  // so they're excluded from what YOU report on a 1099-NEC.
  const paidByVendor = new Map<string, number>();
  for (const e of expenses) {
    if (!e.vendor_id) continue;
    if (e.payment_method === "card") continue;
    paidByVendor.set(e.vendor_id, (paidByVendor.get(e.vendor_id) ?? 0) + e.amount);
  }

  const flagged = vendors.filter((v) => v.is_1099);
  const reportable = flagged.filter((v) => (paidByVendor.get(v.id) ?? 0) >= THRESHOLD_1099);
  const totalReportable = reportable.reduce((s, v) => s + (paidByVendor.get(v.id) ?? 0), 0);
  const missingInfo = reportable.filter((v) => !v.tax_id || !v.w9_on_file);
  // Vendors paid a lot but not yet flagged as contractors — likely need attention.
  const suggestions = vendors.filter((v) => !v.is_1099 && (paidByVendor.get(v.id) ?? 0) >= THRESHOLD_1099);

  return (
    <div>
      <PageHeader title="1099 Contractors" subtitle={`${year} — who you must send a 1099-NEC by Jan 31`} backHref="/accounting/tax" />

      <Alert tone="blue" title="The $600 rule">
        Pay any individual or unincorporated business <strong>$600 or more</strong> for services in a
        year (by cash, check, or ACH) and you must file a <strong>1099-NEC</strong> for them. Get a{" "}
        <strong>W-9</strong> before you pay anyone — chasing tax IDs in January is miserable. Card
        payments are excluded (the processor handles those on a 1099-K).
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="1099s to file" value={reportable.length} tone="blue" />
        <Stat label="Total reportable" value={formatCurrency(totalReportable)} />
        <Stat label="Missing W-9 / tax ID" value={missingInfo.length} tone={missingInfo.length ? "red" : "green"} />
      </div>

      {missingInfo.length > 0 && (
        <div className="mt-5">
          <Alert tone="red" title="Action needed before filing">
            {missingInfo.map((v) => v.name).join(", ")} {missingInfo.length === 1 ? "is" : "are"} over
            $600 but missing a tax ID or W-9. Collect it now.
          </Alert>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-5">
          <Alert tone="amber" title="Possibly missed contractors">
            You paid these vendors $600+ but haven&apos;t marked them as 1099 contractors:{" "}
            <strong>{suggestions.map((v) => `${v.name} (${formatCurrency(paidByVendor.get(v.id) ?? 0)})`).join(", ")}</strong>.
            If they&apos;re incorporated you can skip them — otherwise flag them below.
          </Alert>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <SectionTitle>Vendors</SectionTitle>
        {vendors.length === 0 ? (
          <EmptyState title="No vendors yet" description="Add vendors from the Parts area, then flag the ones who are contractors." />
        ) : (
          vendors.map((v) => {
            const paid = paidByVendor.get(v.id) ?? 0;
            const isReportable = v.is_1099 && paid >= THRESHOLD_1099;
            return (
              <Card key={v.id}>
                <form action={saveVendor1099.bind(null, v.id)} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{v.name}</p>
                      <p className="text-xs text-slate-400">Paid {formatCurrency(paid)} (non-card) in {year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isReportable && <Badge tone="blue">1099-NEC due</Badge>}
                      {v.is_1099 && (!v.tax_id || !v.w9_on_file) && <Badge tone="red">missing info</Badge>}
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input type="checkbox" name="is_1099" defaultChecked={v.is_1099} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        Contractor (gets a 1099)
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Legal name (per W-9)">
                      <input name="legal_name" defaultValue={v.legal_name ?? ""} className="input" />
                    </Field>
                    <Field label="Tax ID (EIN/SSN)">
                      <input name="tax_id" defaultValue={v.tax_id ?? ""} className="input" placeholder="##-#######" />
                    </Field>
                    <Field label="ID type">
                      <select name="tax_id_type" defaultValue={v.tax_id_type ?? "ein"} className="input">
                        <option value="ein">EIN</option>
                        <option value="ssn">SSN</option>
                      </select>
                    </Field>
                    <Field label="Mailing address">
                      <input name="address" defaultValue={v.address ?? ""} className="input" />
                    </Field>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" name="w9_on_file" defaultChecked={v.w9_on_file} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      W-9 on file
                    </label>
                    <button className="btn-secondary">Save</button>
                  </div>
                </form>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
