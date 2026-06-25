import Link from "next/link";
import { Card, Field } from "@/components/ui";
import { PAYMENT_METHODS } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import type { Expense, ExpenseCategory } from "@/lib/database.types";

export function ExpenseForm({
  action,
  categories,
  expense,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: ExpenseCategory[];
  expense?: Partial<Expense>;
  cancelHref: string;
}) {
  const e = expense ?? {};
  return (
    <form action={action} className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required>
            <input type="date" name="expense_date" defaultValue={e.expense_date ?? todayISO()} className="input" required />
          </Field>
          <Field label="Vendor / payee">
            <input name="vendor_name" defaultValue={e.vendor_name ?? ""} className="input" placeholder="NAPA, landlord, etc." />
          </Field>
          <Field label="Category" required hint="Drives your tax-time report">
            <select name="category_id" defaultValue={e.category_id ?? ""} className="input" required>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Payment method">
            <select name="payment_method" defaultValue={e.payment_method ?? "card"} className="input">
              {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount" required>
            <input type="number" step="0.01" name="amount" defaultValue={e.amount ?? ""} className="input" required />
          </Field>
          <Field label="Sales tax paid" hint="Portion of amount that was tax">
            <input type="number" step="0.01" name="tax_amount" defaultValue={e.tax_amount ?? ""} className="input" />
          </Field>
          <Field label="Reference">
            <input name="reference" defaultValue={e.reference ?? ""} className="input" placeholder="Invoice / check #" />
          </Field>
          <Field label="Receipt URL">
            <input name="receipt_url" defaultValue={e.receipt_url ?? ""} className="input" placeholder="Link to scanned receipt" />
          </Field>
        </div>
        <Field label="Description" className="mt-4">
          <textarea name="description" defaultValue={e.description ?? ""} rows={2} className="input" />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button className="btn-primary">Save expense</button>
      </div>
    </form>
  );
}
