import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INSPECTION_RATING } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { InspectionRating } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type InspectionPayload = {
  id: string;
  status: "in_progress" | "completed";
  notes: string | null;
  created_at: string;
  work_order_number: string | null;
  technician: string | null;
  vehicle: { year: number | null; make: string | null; model: string | null; trim: string | null; vin: string | null } | null;
  items: {
    category: string;
    label: string;
    rating: InspectionRating;
    notes: string | null;
    photo_url: string | null;
    sort_order: number;
  }[];
};

export default async function PublicInspectionPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_inspection_by_token", { p_token: params.token });
  if (error || !data) notFound();

  const inspection = data as InspectionPayload;
  const categories = Array.from(new Set(inspection.items.map((i) => i.category)));
  const vehicle = inspection.vehicle;
  const vehicleLabel = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")
    : "Your vehicle";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-slate-900">{vehicleLabel}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Inspected {formatDate(inspection.created_at)}
        {inspection.work_order_number ? ` · Work order ${inspection.work_order_number}` : ""}
        {inspection.technician ? ` · by ${inspection.technician}` : ""}
      </p>

      <div className="mt-6 space-y-6">
        {categories.map((cat) => (
          <div key={cat} className="card card-pad">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{cat}</h2>
            <div className="divide-y divide-slate-100">
              {inspection.items
                .filter((i) => i.category === cat)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-slate-700">{item.label}</p>
                      {item.notes && <p className="mt-0.5 text-sm text-slate-500">{item.notes}</p>}
                      {item.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.photo_url} alt={item.label} className="mt-2 h-24 w-32 rounded-lg object-cover" />
                      )}
                    </div>
                    <span
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${INSPECTION_RATING[item.rating].dot}`}
                      title={INSPECTION_RATING[item.rating].label}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {inspection.notes && (
        <p className="mt-6 text-sm text-slate-500">{inspection.notes}</p>
      )}
    </div>
  );
}
