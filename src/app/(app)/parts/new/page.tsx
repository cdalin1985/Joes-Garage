import { PageHeader } from "@/components/ui";
import { PartForm } from "@/components/forms/PartForm";
import { createPart } from "@/lib/actions/parts";
import { createClient } from "@/lib/supabase/server";
import type { PricingMatrixTier } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function NewPartPage() {
  const supabase = createClient();
  const { data } = await supabase.from("pricing_matrix_tiers").select("*").order("sort_order");
  const tiers = (data as PricingMatrixTier[]) ?? [];
  return (
    <div>
      <PageHeader title="New part" backHref="/parts" />
      <PartForm action={createPart} tiers={tiers} cancelHref="/parts" />
    </div>
  );
}
