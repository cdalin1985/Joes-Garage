import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, SectionTitle, Alert } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import {
  setInspectionItemRating,
  setInspectionItemNotes,
  uploadInspectionPhoto,
  completeInspection,
  deleteInspection,
} from "@/lib/actions/inspections";
import { vehicleName } from "@/lib/display";
import { INSPECTION_RATING } from "@/lib/constants";
import type { Inspection, InspectionItem, InspectionRating, Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Params = { id: string; inspectionId: string };

export default async function InspectionPage({ params }: { params: Params }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("inspections")
    .select("*, vehicles(*), inspection_items(*)")
    .eq("id", params.inspectionId)
    .single();
  if (!data) notFound();

  const inspection = data as Inspection & { vehicles: Vehicle | null; inspection_items: InspectionItem[] };
  const items = (inspection.inspection_items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const categories = Array.from(new Set(items.map((i) => i.category)));
  const shareUrl = `/inspect/${inspection.share_token}`;
  const summary = {
    red: items.filter((i) => i.rating === "red").length,
    yellow: items.filter((i) => i.rating === "yellow").length,
    green: items.filter((i) => i.rating === "green").length,
  };

  return (
    <div>
      <PageHeader
        title="Digital Vehicle Inspection"
        subtitle={inspection.vehicles ? vehicleName(inspection.vehicles) : undefined}
        backHref={`/work-orders/${params.id}`}
        actions={
          <>
            {inspection.status === "completed" ? (
              <Badge tone="green">Completed</Badge>
            ) : (
              <Badge tone="amber">In progress</Badge>
            )}
            <DeleteButton action={deleteInspection.bind(null, inspection.id, params.id)} iconOnly />
          </>
        }
      />

      <Alert tone="blue" title="Customer share link">
        Send <code className="rounded bg-white/60 px-1">{shareUrl}</code> to the customer so they can see
        photos and notes for every point — no login required.{" "}
        <Link href={shareUrl} target="_blank" className="font-semibold underline">
          Open it
        </Link>
        .
      </Alert>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{summary.green}</p>
          <p className="text-xs text-slate-500">Good</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-amber-600">{summary.yellow}</p>
          <p className="text-xs text-slate-500">Needs attention soon</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{summary.red}</p>
          <p className="text-xs text-slate-500">Needs attention now</p>
        </Card>
      </div>

      <div className="mt-6 space-y-6">
        {categories.map((cat) => (
          <Card key={cat}>
            <SectionTitle>{cat}</SectionTitle>
            <div className="divide-y divide-slate-100">
              {items
                .filter((i) => i.category === cat)
                .map((item) => (
                  <div key={item.id} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-700">{item.label}</p>
                      <div className="flex gap-1">
                        {(["green", "yellow", "red", "na"] as InspectionRating[]).map((r) => (
                          <form key={r} action={setInspectionItemRating.bind(null, item.id, params.id, r)}>
                            <button
                              type="submit"
                              title={INSPECTION_RATING[r].label}
                              className={`h-6 w-6 rounded-full ring-2 transition ${INSPECTION_RATING[r].dot} ${
                                item.rating === r ? "ring-slate-700" : "ring-transparent opacity-50 hover:opacity-100"
                              }`}
                            />
                          </form>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <form action={setInspectionItemNotes.bind(null, item.id, params.id)} className="flex gap-2">
                        <input
                          name="notes"
                          defaultValue={item.notes ?? ""}
                          placeholder="Note for this point…"
                          className="input !py-1.5 text-sm"
                        />
                        <button className="btn-secondary !px-3 !py-1.5 text-xs">Save</button>
                      </form>
                      <form
                        action={uploadInspectionPhoto.bind(null, item.id, params.id)}
                        encType="multipart/form-data"
                        className="flex items-center gap-2"
                      >
                        <input type="file" name="photo" accept="image/*" className="input !py-1 text-xs" />
                        <button className="btn-secondary !px-3 !py-1.5 text-xs">Upload</button>
                      </form>
                    </div>
                    {item.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photo_url} alt={item.label} className="mt-2 h-24 w-32 rounded-lg object-cover" />
                    )}
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>

      {inspection.status !== "completed" && (
        <form action={completeInspection.bind(null, inspection.id, params.id)} className="mt-6">
          <button className="btn-primary w-full">Mark inspection complete</button>
        </form>
      )}
    </div>
  );
}
