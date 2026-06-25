import { requireAdmin } from "@/lib/auth";
import { getShopSettings } from "@/lib/queries";
import { PageHeader, Card, Field, SectionTitle, Alert } from "@/components/ui";
import { updateSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { saved?: string } }) {
  await requireAdmin();
  const s = await getShopSettings();

  return (
    <div>
      <PageHeader title="Shop Settings" subtitle="Business info, tax rates, and document defaults" />

      {searchParams.saved && (
        <div className="mb-5">
          <Alert tone="green">Settings saved.</Alert>
        </div>
      )}

      <form action={updateSettings} className="space-y-5">
        <Card>
          <SectionTitle>Business</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop name" required>
              <input name="shop_name" defaultValue={s?.shop_name ?? ""} className="input" required />
            </Field>
            <Field label="Legal name">
              <input name="legal_name" defaultValue={s?.legal_name ?? ""} className="input" />
            </Field>
            <Field label="Phone">
              <input name="phone" defaultValue={s?.phone ?? ""} className="input" />
            </Field>
            <Field label="Email">
              <input name="email" defaultValue={s?.email ?? ""} className="input" />
            </Field>
            <Field label="Website">
              <input name="website" defaultValue={s?.website ?? ""} className="input" />
            </Field>
            <Field label="Address">
              <input name="address_line1" defaultValue={s?.address_line1 ?? ""} className="input" />
            </Field>
            <Field label="City">
              <input name="city" defaultValue={s?.city ?? ""} className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="State">
                <input name="state" defaultValue={s?.state ?? ""} className="input" />
              </Field>
              <Field label="ZIP">
                <input name="postal_code" defaultValue={s?.postal_code ?? ""} className="input" />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Defaults</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default sales tax rate (%)" hint="Applied to new estimates & invoices">
              <input
                name="default_tax_rate_pct"
                type="number"
                step="0.001"
                defaultValue={((s?.default_tax_rate ?? 0) * 100).toString()}
                className="input"
              />
            </Field>
            <Field label="Default labor rate ($/hr)">
              <input
                name="default_labor_rate"
                type="number"
                step="0.01"
                defaultValue={s?.default_labor_rate ?? 120}
                className="input"
              />
            </Field>
            <Field label="Invoice prefix">
              <input name="invoice_prefix" defaultValue={s?.invoice_prefix ?? "INV-"} className="input" />
            </Field>
            <Field label="Estimate prefix">
              <input name="estimate_prefix" defaultValue={s?.estimate_prefix ?? "EST-"} className="input" />
            </Field>
            <Field label="Work order prefix">
              <input name="work_order_prefix" defaultValue={s?.work_order_prefix ?? "WO-"} className="input" />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Invoice terms">
              <textarea name="invoice_terms" defaultValue={s?.invoice_terms ?? ""} rows={2} className="input" />
            </Field>
            <Field label="Estimate terms">
              <textarea name="estimate_terms" defaultValue={s?.estimate_terms ?? ""} rows={2} className="input" />
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle>Tax identifiers</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Federal EIN">
              <input name="ein" defaultValue={s?.ein ?? ""} className="input" />
            </Field>
            <Field label="State sales tax ID">
              <input name="tax_id" defaultValue={s?.tax_id ?? ""} className="input" />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <button className="btn-primary">Save settings</button>
        </div>
      </form>
    </div>
  );
}
