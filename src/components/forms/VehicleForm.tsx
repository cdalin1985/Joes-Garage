"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Card, Field } from "@/components/ui";
import { decodeVin } from "@/lib/actions/vehicles";
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
  const [decoding, setDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const vinRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const makeRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const trimRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<HTMLInputElement>(null);
  const transmissionRef = useRef<HTMLInputElement>(null);
  const drivetrainRef = useRef<HTMLInputElement>(null);

  async function handleDecode() {
    const vin = vinRef.current?.value ?? "";
    setDecodeError(null);
    setDecoding(true);
    try {
      const result = await decodeVin(vin);
      if (!result.ok) {
        setDecodeError(result.error);
        return;
      }
      const { data } = result;
      if (data.year && yearRef.current) yearRef.current.value = String(data.year);
      if (data.make && makeRef.current) makeRef.current.value = data.make;
      if (data.model && modelRef.current) modelRef.current.value = data.model;
      if (data.trim && trimRef.current) trimRef.current.value = data.trim;
      if (data.engine && engineRef.current) engineRef.current.value = data.engine;
      if (data.transmission && transmissionRef.current) transmissionRef.current.value = data.transmission;
      if (data.drivetrain && drivetrainRef.current) drivetrainRef.current.value = data.drivetrain;
    } finally {
      setDecoding(false);
    }
  }

  return (
    <form action={action} className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Year">
            <input ref={yearRef} name="year" defaultValue={v.year ?? ""} inputMode="numeric" className="input" />
          </Field>
          <Field label="Make">
            <input ref={makeRef} name="make" defaultValue={v.make ?? ""} className="input" placeholder="Honda" />
          </Field>
          <Field label="Model">
            <input ref={modelRef} name="model" defaultValue={v.model ?? ""} className="input" placeholder="Civic" />
          </Field>
          <Field label="Trim">
            <input ref={trimRef} name="trim" defaultValue={v.trim ?? ""} className="input" />
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
          <Field label="VIN" className="sm:col-span-2" hint={decodeError ?? "Decode pulls year/make/model/trim/engine free from NHTSA — no labor-guide subscription needed."}>
            <div className="flex gap-2">
              <input ref={vinRef} name="vin" defaultValue={v.vin ?? ""} className="input font-mono uppercase" maxLength={17} />
              <button
                type="button"
                onClick={handleDecode}
                disabled={decoding}
                className="btn-secondary shrink-0 whitespace-nowrap"
              >
                {decoding ? "Decoding…" : "Decode VIN"}
              </button>
            </div>
          </Field>
          <Field label="License plate">
            <input name="license_plate" defaultValue={v.license_plate ?? ""} className="input uppercase" />
          </Field>
          <Field label="Plate state">
            <input name="license_state" defaultValue={v.license_state ?? ""} className="input uppercase" />
          </Field>
          <Field label="Engine">
            <input ref={engineRef} name="engine" defaultValue={v.engine ?? ""} className="input" placeholder="2.0L I4" />
          </Field>
          <Field label="Transmission">
            <input ref={transmissionRef} name="transmission" defaultValue={v.transmission ?? ""} className="input" />
          </Field>
          <Field label="Drivetrain">
            <input ref={drivetrainRef} name="drivetrain" defaultValue={v.drivetrain ?? ""} className="input" placeholder="FWD / AWD" />
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
