"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Field } from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { LINE_ITEM_TYPES, WORK_ORDER_PRIORITY, WORK_ORDER_STATUS } from "@/lib/constants";
import type {
  Customer,
  Part,
  Profile,
  Vehicle,
  LineItemType,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@/lib/database.types";
import type { EditorItem } from "@/components/forms/DocumentEditor";

export type WorkOrderDefaults = {
  customer_id?: string | null;
  vehicle_id?: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assigned_to?: string | null;
  odometer_in?: number | null;
  odometer_out?: number | null;
  customer_concern?: string | null;
  diagnosis?: string | null;
  work_performed?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  items: EditorItem[];
};

export function WorkOrderEditor({
  action,
  customers,
  vehicles,
  parts,
  technicians,
  laborRate,
  defaults,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  customers: Customer[];
  vehicles: Vehicle[];
  parts: Part[];
  technicians: Profile[];
  laborRate: number;
  defaults: WorkOrderDefaults;
  cancelHref: string;
}) {
  const [customerId, setCustomerId] = useState(defaults.customer_id ?? "");
  const [vehicleId, setVehicleId] = useState(defaults.vehicle_id ?? "");
  const [items, setItems] = useState<EditorItem[]>(defaults.items);

  const customerVehicles = useMemo(
    () => vehicles.filter((v) => v.customer_id === customerId),
    [vehicles, customerId],
  );
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  function addItem(type: LineItemType) {
    setItems((p) => [
      ...p,
      {
        item_type: type,
        description: type === "labor" ? "" : "",
        quantity: 1,
        unit_price: type === "labor" ? laborRate : 0,
        taxable: type === "part" || type === "fee",
        part_id: null,
      },
    ]);
  }
  function addPart(partId: string) {
    const p = parts.find((x) => x.id === partId);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        item_type: "part",
        description: p.part_number ? `${p.name} (${p.part_number})` : p.name,
        quantity: 1,
        unit_price: p.price,
        taxable: p.taxable,
        part_id: p.id,
      },
    ]);
  }
  const update = (i: number, patch: Partial<EditorItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" required>
            <select
              name="customer_id"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setVehicleId("");
              }}
              className="input"
              required
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || "Unnamed"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vehicle">
            <select
              name="vehicle_id"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="input"
              disabled={!customerId}
            >
              <option value="">{customerId ? "Select a vehicle…" : "Pick a customer first"}</option>
              {customerVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={defaults.status} className="input">
              {Object.entries(WORK_ORDER_STATUS).map(([v, m]) => (
                <option key={v} value={v}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select name="priority" defaultValue={defaults.priority} className="input">
              {Object.entries(WORK_ORDER_PRIORITY).map(([v, m]) => (
                <option key={v} value={v}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assigned technician">
            <select name="assigned_to" defaultValue={defaults.assigned_to ?? ""} className="input">
              <option value="">Unassigned</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Odometer in">
              <input name="odometer_in" defaultValue={defaults.odometer_in ?? ""} inputMode="numeric" className="input" />
            </Field>
            <Field label="Odometer out">
              <input name="odometer_out" defaultValue={defaults.odometer_out ?? ""} inputMode="numeric" className="input" />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4">
          <Field label="Customer concern">
            <textarea name="customer_concern" defaultValue={defaults.customer_concern ?? ""} rows={2} className="input" placeholder="What the customer reported" />
          </Field>
          <Field label="Diagnosis">
            <textarea name="diagnosis" defaultValue={defaults.diagnosis ?? ""} rows={2} className="input" placeholder="What the technician found" />
          </Field>
          <Field label="Work performed">
            <textarea name="work_performed" defaultValue={defaults.work_performed ?? ""} rows={2} className="input" />
          </Field>
          <Field label="Recommendations / declined work">
            <textarea name="recommendations" defaultValue={defaults.recommendations ?? ""} rows={2} className="input" />
          </Field>
        </div>
      </Card>

      <Card pad={false}>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Parts &amp; labor</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 w-20 text-right">Qty/Hrs</th>
                <th className="px-4 py-2 w-28 text-right">Rate</th>
                <th className="px-4 py-2 w-28 text-right">Amount</th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Add labor and parts as the job progresses.
                  </td>
                </tr>
              )}
              {items.map((it, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <select
                      value={it.item_type}
                      onChange={(e) => update(idx, { item_type: e.target.value as LineItemType })}
                      className="input !py-1 !px-2 text-xs"
                    >
                      {Object.entries(LINE_ITEM_TYPES).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input value={it.description} onChange={(e) => update(idx, { description: e.target.value })} className="input !py-1" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" step="0.1" value={it.quantity} onChange={(e) => update(idx, { quantity: parseFloat(e.target.value) || 0 })} className="input !py-1 text-right" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" step="0.01" value={it.unit_price} onChange={(e) => update(idx, { unit_price: parseFloat(e.target.value) || 0 })} className="input !py-1 text-right" />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(it.quantity * it.unit_price)}</td>
                  <td className="px-2 py-2 text-center">
                    <button type="button" onClick={() => remove(idx)} className="text-slate-400 hover:text-red-500">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={() => addItem("labor")} className="btn-secondary !py-1 text-xs">
            <IconPlus className="h-3.5 w-3.5" /> Labor
          </button>
          <button type="button" onClick={() => addItem("part")} className="btn-secondary !py-1 text-xs">
            <IconPlus className="h-3.5 w-3.5" /> Part
          </button>
          <button type="button" onClick={() => addItem("fee")} className="btn-secondary !py-1 text-xs">
            <IconPlus className="h-3.5 w-3.5" /> Fee
          </button>
          {parts.length > 0 && (
            <select
              className="input !py-1 ml-auto max-w-[220px] text-xs"
              value=""
              onChange={(e) => {
                if (e.target.value) addPart(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">+ From inventory…</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.price)}
                </option>
              ))}
            </select>
          )}
          <span className="ml-auto text-sm font-semibold text-slate-700">
            Parts &amp; labor: {formatCurrency(subtotal)}
          </span>
        </div>
      </Card>

      <Card>
        <Field label="Internal notes">
          <textarea name="notes" defaultValue={defaults.notes ?? ""} rows={2} className="input" />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary" disabled={!customerId}>
          Save work order
        </button>
      </div>
    </form>
  );
}
