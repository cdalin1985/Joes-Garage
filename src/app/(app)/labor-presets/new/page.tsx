import { PageHeader } from "@/components/ui";
import { LaborPresetForm } from "@/components/forms/LaborPresetForm";
import { createLaborPreset } from "@/lib/actions/labor-presets";

export default function NewLaborPresetPage() {
  return (
    <div>
      <PageHeader title="New canned job" backHref="/labor-presets" />
      <LaborPresetForm action={createLaborPreset} cancelHref="/labor-presets" />
    </div>
  );
}
