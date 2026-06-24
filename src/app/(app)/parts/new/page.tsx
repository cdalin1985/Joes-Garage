import { PageHeader } from "@/components/ui";
import { PartForm } from "@/components/forms/PartForm";
import { createPart } from "@/lib/actions/parts";

export default function NewPartPage() {
  return (
    <div>
      <PageHeader title="New part" backHref="/parts" />
      <PartForm action={createPart} cancelHref="/parts" />
    </div>
  );
}
