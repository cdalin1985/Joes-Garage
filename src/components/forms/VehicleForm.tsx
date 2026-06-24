import Link from "next/link";
import { Card, Field } from "@/components/ui";
import type { Vehicle } from "@/lib/database.types";

export function VehicleForm({
  action,
  vehicle,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  vehicle?: Partial<Vehicle>;
  cancelHref: string;
}) {
  const v = vehicle ?? {};
  return (
    <form action={action} className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Year">
            <input name="year" defaultValue={v.year ?? ""} inputMode="numeric" className="input" />
          </Field>
          <Field label="Make">
            <input name="make" defaultValue={v.make ?? ""} className="input" placeholder="Honda" />
          </Field>
          <Field label="Model">
            <input name="model" defaultValue={v.model ?? ""} className="input" placeholder="Civic" />
          </Field>
          <Field label="Trim">
            <input name="trim" defaultValue={v.trim ?? ""} className="input" />
          </Field>
          <Field label="Color">
            <input name="color" defaultValue={v.color ?? ""} className="input" />
          </Field>
          <Field label="Mileage">
            <input name="mileage" defaultValue={v.mileage ?? ""} inputMode="numeric" className="input" />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="VIN" className="sm:col-span-2">
            <input name="vin" defaultValue={v.vin ?? ""} className="input font-mono uppercase" />
          </Field>
          <Field label="License plate">
            <input name="license_plate" defaultValue={v.license_plate ?? ""} className="input uppercase" />
          </Field>
          <Field label="Plate state">
            <input name="license_state" defaultValue={v.license_state ?? ""} className="input uppercase" />
          </Field>
          <Field label="Engine">
            <input name="engine" defaultValue={v.engine ?? ""} className="input" placeholder="2.0L I4" />
          </Field>
          <Field label="Transmission">
            <input name="transmission" defaultValue={v.transmission ?? ""} className="input" />
          </Field>
          <Field label="Drivetrain">
            <input name="drivetrain" defaultValue={v.drivetrain ?? ""} className="input" placeholder="FWD / AWD" />
          </Field>
          <Field label="Unit # (fleet)">
            <input name="unit_number" defaultValue={v.unit_number ?? ""} className="input" />
          </Field>
        </div>
      </Card>

      <Card>
        <Field label="Notes">
          <textarea name="notes" defaultValue={v.notes ?? ""} rows={2} className="input" />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary">
          Save vehicle
        </button>
      </div>
    </form>
  );
}
