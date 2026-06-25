import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { PartForm } from "@/components/forms/PartForm";
import { updatePart, deletePart } from "@/lib/actions/parts";
import { DeleteButton } from "@/components/DeleteButton";
import type { Part } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditPartPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("parts").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const part = data as Part;

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
      <PartForm action={action} part={part} cancelHref="/parts" />
    </div>
  );
}
