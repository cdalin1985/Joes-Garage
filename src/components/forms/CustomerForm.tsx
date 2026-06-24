import Link from "next/link";
import { Card, Field } from "@/components/ui";
import type { Customer } from "@/lib/database.types";

export function CustomerForm({
  action,
  customer,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  customer?: Partial<Customer>;
  cancelHref: string;
}) {
  const c = customer ?? {};
  return (
    <form action={action} className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input name="first_name" defaultValue={c.first_name ?? ""} className="input" />
          </Field>
          <Field label="Last name">
            <input name="last_name" defaultValue={c.last_name ?? ""} className="input" />
          </Field>
          <Field label="Company" className="sm:col-span-2" hint="For fleet / commercial accounts">
            <input name="company" defaultValue={c.company ?? ""} className="input" />
          </Field>
          <Field label="Customer type">
            <select name="customer_type" defaultValue={c.customer_type ?? "individual"} className="input">
              <option value="individual">Individual</option>
              <option value="fleet">Fleet</option>
              <option value="commercial">Commercial</option>
            </select>
          </Field>
          <Field label="Preferred contact">
            <select name="preferred_contact" defaultValue={c.preferred_contact ?? "phone"} className="input">
              <option value="phone">Phone</option>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="any">Any</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input name="phone" defaultValue={c.phone ?? ""} className="input" />
          </Field>
          <Field label="Mobile">
            <input name="mobile" defaultValue={c.mobile ?? ""} className="input" />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <input type="email" name="email" defaultValue={c.email ?? ""} className="input" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input name="address_line1" defaultValue={c.address_line1 ?? ""} className="input" />
          </Field>
          <Field label="City">
            <input name="city" defaultValue={c.city ?? ""} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="State">
              <input name="state" defaultValue={c.state ?? ""} className="input" />
            </Field>
            <Field label="ZIP">
              <input name="postal_code" defaultValue={c.postal_code ?? ""} className="input" />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <Field label="Notes">
          <textarea name="notes" defaultValue={c.notes ?? ""} rows={3} className="input" />
        </Field>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="tax_exempt" defaultChecked={c.tax_exempt ?? false} />
          Tax exempt (no sales tax on this customer&apos;s invoices)
        </label>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary">
          Save customer
        </button>
      </div>
    </form>
  );
}
