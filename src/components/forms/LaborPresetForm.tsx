import Link from "next/link";
import { Card, Field } from "@/components/ui";
import type { LaborPreset } from "@/lib/database.types";

export function LaborPresetForm({
  action,
  preset,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  preset?: Partial<LaborPreset>;
  cancelHref: string;
}) {
  const p = preset ?? {};
  return (
    <form action={action} className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job name" required className="sm:col-span-2">
            <input
              name="name"
              defaultValue={p.name ?? ""}
              className="input"
              placeholder="Brake pad replacement (front)"
              required
            />
          </Field>
          <Field label="Category">
            <input name="category" defaultValue={p.category ?? ""} className="input" placeholder="Brakes, Oil change…" />
          </Field>
          <Field label="Default hours">
            <input type="number" step="0.1" name="default_hours" defaultValue={p.default_hours ?? 1} className="input" />
          </Field>
          <Field label="Default rate ($/hr)" hint="Leave blank to use the shop's default labor rate">
            <input type="number" step="0.01" name="default_rate" defaultValue={p.default_rate ?? ""} className="input" />
          </Field>
        </div>
        <Field label="Notes" className="mt-4">
          <textarea name="notes" defaultValue={p.notes ?? ""} rows={2} className="input" />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button className="btn-primary">Save job</button>
      </div>
    </form>
  );
}
