import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { PartForm } from "@/components/forms/PartForm";
import { updatePart, deletePart } from "@/lib/actions/parts";
import { DeleteButton } from "@/components/DeleteButton";
import type { Part, PricingMatrixTier } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditPartPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data }, { data: tierData }] = await Promise.all([
    supabase.from("parts").select("*").eq("id", params.id).single(),
    supabase.from("pricing_matrix_tiers").select("*").order("sort_order"),
  ]);
  if (!data) notFound();
  const part = data as Part;
  const tiers = (tierData as PricingMatrixTier[]) ?? [];

  const action = updatePart.bind(null, params.id);

  return (
    <div>
      <PageHeader
        title={`Edit ${part.name}`}
        backHref="/parts"
        actions={
          <DeleteButton
            action={deletePart.bind(null, params.id)}
            label="Archive"
            confirmText="Archive this part? It will be hidden from the catalog."
          />
        }
      />
      <PartForm action={action} part={part} tiers={tiers} cancelHref="/parts" />
    </div>
  );
}
