import { Card } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { LINE_ITEM_TYPES } from "@/lib/constants";
import { customerName, vehicleName } from "@/lib/display";
import type {
  Customer,
  Vehicle,
  ShopSettings,
  LineItem,
} from "@/lib/database.types";

type DocHeader = {
  number: string | null;
  issue_date: string;
  secondDateLabel: string;
  secondDate: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  amount_paid?: number;
  balance_due?: number;
};

export function DocumentView({
  title,
  shop,
  customer,
  vehicle,
  doc,
  items,
}: {
  title: string;
  shop: ShopSettings | null;
  customer: Customer | null;
  vehicle: Vehicle | null;
  doc: DocHeader;
  items: LineItem[];
}) {
  return (
    <Card className="print:border-0 print:shadow-none">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500 font-display text-sm font-black text-slate-900">
              JG
            </span>
            <div>
              <p className="text-lg font-bold text-slate-900">{shop?.shop_name ?? "Joe's Garage"}</p>
              <p className="text-xs text-slate-500">
                {[shop?.address_line1, shop?.city, shop?.state, shop?.postal_code]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {[shop?.phone, shop?.email].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold uppercase tracking-wide text-slate-300">{title}</p>
          <p className="text-lg font-semibold text-slate-800">{doc.number}</p>
          <p className="text-xs text-slate-500">Issued {formatDate(doc.issue_date)}</p>
          {doc.secondDate && (
            <p className="text-xs text-slate-500">
              {doc.secondDateLabel} {formatDate(doc.secondDate)}
            </p>
          )}
        </div>
      </div>

      {/* Bill to / vehicle */}
      <div className="grid gap-6 py-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Bill to</p>
          <p className="mt-1 font-medium text-slate-800">{customerName(customer)}</p>
          {customer && (
            <p className="text-sm text-slate-500">
              {[customer.address_line1, [customer.city, customer.state].filter(Boolean).join(", ")]
                .filter(Boolean)
                .join(" ")}
            </p>
          )}
          {customer?.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
          {customer?.email && <p className="text-sm text-slate-500">{customer.email}</p>}
        </div>
        {vehicle && (
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase text-slate-400">Vehicle</p>
            <p className="mt-1 font-medium text-slate-800">{vehicleName(vehicle)}</p>
            {vehicle.vin && <p className="text-sm text-slate-500">VIN {vehicle.vin}</p>}
            {vehicle.license_plate && <p className="text-sm text-slate-500">Plate {vehicle.license_plate}</p>}
            {vehicle.mileage != null && (
              <p className="text-sm text-slate-500">{vehicle.mileage.toLocaleString()} mi</p>
            )}
          </div>
        )}
      </div>

      {/* Line items */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-slate-200 text-left text-xs uppercase text-slate-400">
            <th className="py-2 pr-2">Type</th>
            <th className="py-2 pr-2">Description</th>
            <th className="py-2 px-2 text-right">Qty</th>
            <th className="py-2 px-2 text-right">Rate</th>
            <th className="py-2 pl-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-slate-400">
                No line items.
              </td>
            </tr>
          )}
          {items.map((it) => (
            <tr key={it.id} className="border-b border-slate-100">
              <td className="py-2 pr-2 text-xs text-slate-400">{LINE_ITEM_TYPES[it.item_type]}</td>
              <td className="py-2 pr-2 text-slate-700">{it.description}</td>
              <td className="py-2 px-2 text-right">{it.quantity}</td>
              <td className="py-2 px-2 text-right">{formatCurrency(it.unit_price)}</td>
              <td className="py-2 pl-2 text-right font-medium">{formatCurrency(it.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <dl className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="font-medium">{formatCurrency(doc.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">
              Tax ({(doc.tax_rate * 100).toFixed(2).replace(/\.00$/, "")}%)
            </dt>
            <dd className="font-medium">{formatCurrency(doc.tax_amount)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base">
            <dt className="font-semibold text-slate-700">Total</dt>
            <dd className="font-bold text-slate-900">{formatCurrency(doc.total)}</dd>
          </div>
          {doc.amount_paid != null && (
            <>
              <div className="flex justify-between">
                <dt className="text-slate-500">Paid</dt>
                <dd className="font-medium text-emerald-600">-{formatCurrency(doc.amount_paid)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base">
                <dt className="font-semibold text-slate-700">Balance due</dt>
                <dd className={`font-bold ${(doc.balance_due ?? 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(doc.balance_due ?? 0)}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {(doc.notes || doc.terms) && (
        <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-sm">
          {doc.notes && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Notes</p>
              <p className="text-slate-600">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Terms</p>
              <p className="text-slate-600">{doc.terms}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
