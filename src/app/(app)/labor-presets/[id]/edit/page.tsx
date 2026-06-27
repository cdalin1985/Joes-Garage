import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { LaborPresetForm } from "@/components/forms/LaborPresetForm";
import { updateLaborPreset, deleteLaborPreset } from "@/lib/actions/labor-presets";
import { DeleteButton } from "@/components/DeleteButton";
import type { LaborPreset } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditLaborPresetPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("labor_presets").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const preset = data as LaborPreset;

  const action = updateLaborPreset.bind(null, params.id);

  return (
    <div>
      <PageHeader
        title={`Edit ${preset.name}`}
        backHref="/labor-presets"
        actions={
          <DeleteButton
            action={deleteLaborPreset.bind(null, params.id)}
            label="Archive"
            confirmText="Archive this canned job?"
          />
        }
      />
      <LaborPresetForm action={action} preset={preset} cancelHref="/labor-presets" />
    </div>
  );
}
