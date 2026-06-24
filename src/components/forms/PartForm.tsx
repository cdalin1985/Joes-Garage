import Link from "next/link";
import { Card, Field } from "@/components/ui";
import type { Part } from "@/lib/database.types";

export function PartForm({
  action,
  part,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  part?: Partial<Part>;
  cancelHref: string;
}) {
  const p = part ?? {};
  return (
    <form action={action} className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Part name" required className="sm:col-span-2">
            <input name="name" defaultValue={p.name ?? ""} className="input" required />
          </Field>
          <Field label="Part number">
            <input name="part_number" defaultValue={p.part_number ?? ""} className="input" />
          </Field>
          <Field label="Brand">
            <input name="brand" defaultValue={p.brand ?? ""} className="input" />
          </Field>
          <Field label="Category">
            <input name="category" defaultValue={p.category ?? ""} className="input" placeholder="Brakes, Filters…" />
          </Field>
          <Field label="Bin location">
            <input name="bin_location" defaultValue={p.bin_location ?? ""} className="input" />
          </Field>
          <Field label="Cost (you pay)">
            <input type="number" step="0.01" name="cost" defaultValue={p.cost ?? ""} className="input" />
          </Field>
          <Field label="Price (customer pays)">
            <input type="number" step="0.01" name="price" defaultValue={p.price ?? ""} className="input" />
          </Field>
          <Field label="Qty on hand">
            <input type="number" step="1" name="quantity_on_hand" defaultValue={p.quantity_on_hand ?? 0} className="input" />
          </Field>
          <Field label="Reorder level">
            <input type="number" step="1" name="reorder_level" defaultValue={p.reorder_level ?? 0} className="input" />
          </Field>
        </div>
        <Field label="Description" className="mt-4">
          <textarea name="description" defaultValue={p.description ?? ""} rows={2} className="input" />
        </Field>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="taxable" defaultChecked={p.taxable ?? true} />
          Taxable
        </label>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button className="btn-primary">Save part</button>
      </div>
    </form>
  );
}
