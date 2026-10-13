"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Field } from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import type { Part, Vendor } from "@/lib/database.types";
import type { POEditorItem } from "@/lib/actions/purchase-orders";

export function PurchaseOrderEditor({
  action,
  vendors,
  parts,
  defaults,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  vendors: Vendor[];
  parts: Part[];
  defaults: {
    vendor_id?: string | null;
    expected_at?: string | null;
    notes?: string | null;
    items: POEditorItem[];
  };
  cancelHref: string;
}) {
  const [vendorId, setVendorId] = useState(defaults.vendor_id ?? "");
  const [items, setItems] = useState<POEditorItem[]>(defaults.items);

  const total = items.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0);

  function addRow() {
    setItems((prev) => [...prev, { part_id: null, description: "", quantity_ordered: 1, unit_cost: 0 }]);
  }
  function addPart(partId: string) {
    const p = parts.find((x) => x.id === partId);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        part_id: p.id,
        description: p.part_number ? `${p.name} (${p.part_number})` : p.name,
        quantity_ordered: 1,
        unit_cost: p.cost,
      },
    ]);
  }
  function update(idx: number, patch: Partial<POEditorItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor" required>
            <select
              name="vendor_id"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expected date">
            <input type="date" name="expected_at" defaultValue={defaults.expected_at ?? ""} className="input" />
          </Field>
        </div>
        <Field label="Notes" className="mt-4">
          <textarea name="notes" defaultValue={defaults.notes ?? ""} rows={2} className="input" />
        </Field>
      </Card>

      <Card pad={false}>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Items to order</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 w-24 text-right">Qty</th>
                <th className="px-4 py-2 w-28 text-right">Unit cost</th>
                <th className="px-4 py-2 w-28 text-right">Amount</th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No items yet — add parts to order below.
                  </td>
                </tr>
              )}
              {items.map((it, idx) => (
                <tr key={idx} className="border-t border-slate-100">
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
                      step="1"
                      value={it.quantity_ordered}
                      onChange={(e) => update(idx, { quantity_ordered: parseFloat(e.target.value) || 0 })}
                      className="input !py-1 text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={it.unit_cost}
                      onChange={(e) => update(idx, { unit_cost: parseFloat(e.target.value) || 0 })}
                      className="input !py-1 text-right"
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(it.quantity_ordered * it.unit_cost)}
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
          <button type="button" onClick={addRow} className="btn-secondary !py-1 text-xs">
            <IconPlus className="h-3.5 w-3.5" /> Item
          </button>
          {parts.length > 0 && (
            <select
              className="input !py-1 ml-auto max-w-[240px] text-xs"
              value=""
              onChange={(e) => {
                if (e.target.value) addPart(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">+ Add from inventory…</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.cost)}
                </option>
              ))}
            </select>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
          <dt className="font-semibold text-slate-700">Total</dt>
          <dd className="font-bold text-slate-900">{formatCurrency(total)}</dd>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary" disabled={!vendorId}>
          Create purchase order
        </button>
      </div>
    </form>
  );
}
