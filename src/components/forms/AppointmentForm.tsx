"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Field } from "@/components/ui";
import type { Customer, Profile, Vehicle } from "@/lib/database.types";

export function AppointmentForm({
  action,
  customers,
  vehicles,
  technicians,
  defaultStart,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  customers: Customer[];
  vehicles: Vehicle[];
  technicians: Profile[];
  defaultStart?: string;
  cancelHref: string;
}) {
  const [customerId, setCustomerId] = useState("");
  const customerVehicles = useMemo(
    () => vehicles.filter((v) => v.customer_id === customerId),
    [vehicles, customerId],
  );

  return (
    <form action={action} className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2">
            <input name="title" className="input" defaultValue="Service Appointment" required />
          </Field>
          <Field label="Customer">
            <select
              name="customer_id"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="input"
            >
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || "Unnamed"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vehicle">
            <select name="vehicle_id" className="input" disabled={!customerId}>
              <option value="">—</option>
              {customerVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start" required>
            <input type="datetime-local" name="start_time" className="input" defaultValue={defaultStart} required />
          </Field>
          <Field label="End">
            <input type="datetime-local" name="end_time" className="input" />
          </Field>
          <Field label="Technician">
            <select name="assigned_to" className="input">
              <option value="">Unassigned</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue="scheduled" className="input">
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </Field>
        </div>
        <Field label="Notes" className="mt-4">
          <textarea name="description" rows={2} className="input" />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button className="btn-primary">Save appointment</button>
      </div>
    </form>
  );
}
