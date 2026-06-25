"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Field } from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { LINE_ITEM_TYPES } from "@/lib/constants";
import type {
  Customer,
  Part,
  Vehicle,
  LineItemType,
} from "@/lib/database.types";

export type EditorItem = {
  item_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  taxable: boolean;
  part_id: string | null;
};

export type DocumentDefaults = {
  customer_id?: string | null;
  vehicle_id?: string | null;
  issue_date: string;
  second_date?: string | null; // expiry (estimate) or due (invoice)
  tax_rate_pct: number; // e.g. 8.25
  status: string;
  notes?: string | null;
  terms?: string | null;
  customer_concern?: string | null;
  items: EditorItem[];
};

const STATUS_OPTIONS: Record<"estimate" | "invoice", { value: string; label: string }[]> = {
  estimate: [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "approved", label: "Approved" },
    { value: "declined", label: "Declined" },
    { value: "expired", label: "Expired" },
  ],
  invoice: [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "void", label: "Void" },
  ],
};

export function DocumentEditor({
  kind,
  action,
  customers,
  vehicles,
  parts,
  laborRate,
  defaults,
  cancelHref,
}: {
  kind: "estimate" | "invoice";
  action: (formData: FormData) => void | Promise<void>;
  customers: Customer[];
  vehicles: Vehicle[];
  parts: Part[];
  laborRate: number;
  defaults: DocumentDefaults;
  cancelHref: string;
}) {
  const [customerId, setCustomerId] = useState(defaults.customer_id ?? "");
  const [vehicleId, setVehicleId] = useState(defaults.vehicle_id ?? "");
  const [taxRatePct, setTaxRatePct] = useState(defaults.tax_rate_pct);
  const [items, setItems] = useState<EditorItem[]>(defaults.items);

  const customerVehicles = useMemo(
    () => vehicles.filter((v) => v.customer_id === customerId),
    [vehicles, customerId],
  );

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxableBase = items
    .filter((i) => i.taxable && i.item_type !== "discount" && i.quantity * i.unit_price > 0)
    .reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const tax = Math.round(taxableBase * (taxRatePct / 100) * 100) / 100;
  const total = subtotal + tax;

  function addItem(type: LineItemType) {
    const presets: Record<LineItemType, Partial<EditorItem>> = {
      labor: { description: "", unit_price: laborRate, taxable: false, quantity: 1 },
      part: { description: "", unit_price: 0, taxable: true, quantity: 1 },
      sublet: { description: "", unit_price: 0, taxable: false, quantity: 1 },
      fee: { description: "Shop supplies", unit_price: 0, taxable: true, quantity: 1 },
      discount: { description: "Discount", unit_price: 0, taxable: false, quantity: 1 },
    };
    setItems((prev) => [
      ...prev,
      {
        item_type: type,
        description: presets[type].description ?? "",
        quantity: presets[type].quantity ?? 1,
        unit_price: presets[type].unit_price ?? 0,
        taxable: presets[type].taxable ?? true,
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

  function update(idx: number, patch: Partial<EditorItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const dateLabel = kind === "estimate" ? "Expiry date" : "Due date";

  return (
    <form action={action} className="space-y-5">
      {/* serialized line items + computed tax rate (decimal) */}
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="tax_rate" value={(taxRatePct / 100).toString()} />

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
          <Field label="Issue date">
            <input type="date" name="issue_date" defaultValue={defaults.issue_date} className="input" />
          </Field>
          <Field label={dateLabel}>
            <input type="date" name="second_date" defaultValue={defaults.second_date ?? ""} className="input" />
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={defaults.status} className="input">
              {STATUS_OPTIONS[kind].map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tax rate (%)">
            <input
              type="number"
              step="0.001"
              value={taxRatePct}
              onChange={(e) => setTaxRatePct(parseFloat(e.target.value) || 0)}
              className="input"
            />
          </Field>
        </div>
        {kind === "estimate" && (
          <Field label="Customer concern" className="mt-4">
            <textarea
              name="customer_concern"
              defaultValue={defaults.customer_concern ?? ""}
              rows={2}
              className="input"
              placeholder="What the customer reported…"
            />
          </Field>
        )}
      </Card>

      <Card pad={false}>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Line items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 w-20 text-right">Qty/Hrs</th>
                <th className="px-4 py-2 w-28 text-right">Rate</th>
                <th className="px-4 py-2 w-16 text-center">Tax</th>
                <th className="px-4 py-2 w-28 text-right">Amount</th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No line items yet — add labor, parts, or fees below.
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
                    <input
                      value={it.description}
                      onChange={(e) => update(idx, { description: e.target.value })}
                      className="input !py-1"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.1"
                      value={it.quantity}
                      onChange={(e) => update(idx, { quantity: parseFloat(e.target.value) || 0 })}
                      className="input !py-1 text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={it.unit_price}
                      onChange={(e) => update(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                      className="input !py-1 text-right"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={it.taxable}
                      onChange={(e) => update(idx, { taxable: e.target.checked })}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(it.quantity * it.unit_price)}
                  </td>
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
          <button type="button" onClick={() => addItem("discount")} className="btn-secondary !py-1 text-xs">
            <IconPlus className="h-3.5 w-3.5" /> Discount
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
              <option value="">+ Add from inventory…</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.price)}
                </option>
              ))}
            </select>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Field label="Notes">
            <textarea name="notes" defaultValue={defaults.notes ?? ""} rows={3} className="input" />
          </Field>
          <Field label="Terms" className="mt-3">
            <textarea name="terms" defaultValue={defaults.terms ?? ""} rows={2} className="input" />
          </Field>
        </Card>
        <Card>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tax ({taxRatePct}%)</dt>
              <dd className="font-medium">{formatCurrency(tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <dt className="font-semibold text-slate-700">Total</dt>
              <dd className="font-bold text-slate-900">{formatCurrency(total)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary" disabled={!customerId}>
          Save {kind}
        </button>
      </div>
    </form>
  );
}
