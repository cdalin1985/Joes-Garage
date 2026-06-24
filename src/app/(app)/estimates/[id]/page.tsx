import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, Alert } from "@/components/ui";
import { DocumentView } from "@/components/DocumentView";
import { PrintButton } from "@/components/PrintButton";
import { DeleteButton } from "@/components/DeleteButton";
import { ESTIMATE_STATUS } from "@/lib/constants";
import {
  setEstimateStatus,
  deleteEstimate,
  convertEstimateToInvoice,
} from "@/lib/actions/estimates";
import { getShopSettings } from "@/lib/queries";
import type { Customer, Estimate, EstimateItem, Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EstimateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = params.id;

  const [{ data: estimate }, settings] = await Promise.all([
    supabase
      .from("estimates")
      .select("*, customers(*), vehicles(*), estimate_items(*)")
      .eq("id", id)
      .single(),
    getShopSettings(),
  ]);

  if (!estimate) notFound();
  const e = estimate as Estimate & {
    customers: Customer | null;
    vehicles: Vehicle | null;
    estimate_items: EstimateItem[];
  };
  const items = (e.estimate_items ?? []).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <PageHeader
        title={`Estimate ${e.number}`}
        backHref="/estimates"
        subtitle={undefined}
        actions={
          <>
            <Badge tone={ESTIMATE_STATUS[e.status].tone}>{ESTIMATE_STATUS[e.status].label}</Badge>
            <PrintButton />
            {e.status !== "converted" && (
              <Link href={`/estimates/${id}/edit`} className="btn-secondary">
                Edit
              </Link>
            )}
            <DeleteButton action={deleteEstimate.bind(null, id)} iconOnly />
          </>
        }
      />

      {/* Workflow actions */}
      <div className="mb-5 flex flex-wrap items-center gap-2 print:hidden">
        {e.status === "draft" && (
          <StatusForm id={id} status="sent" label="Mark as sent" className="btn-secondary" />
        )}
        {(e.status === "sent" || e.status === "draft") && (
          <>
            <StatusForm id={id} status="approved" label="Mark approved" className="btn-secondary" />
            <StatusForm id={id} status="declined" label="Mark declined" className="btn-secondary" />
          </>
        )}
        {e.status !== "converted" && (
          <form action={convertEstimateToInvoice.bind(null, id)}>
            <button className="btn-accent">Convert to invoice →</button>
          </form>
        )}
        {e.status === "converted" && (
          <Alert tone="green">This estimate has been converted to an invoice.</Alert>
        )}
      </div>

      <DocumentView
        title="Estimate"
        shop={settings}
        customer={e.customers}
        vehicle={e.vehicles}
        items={items}
        doc={{
          number: e.number,
          issue_date: e.issue_date,
          secondDateLabel: "Valid until",
          secondDate: e.expiry_date,
          subtotal: e.subtotal,
          tax_rate: e.tax_rate,
          tax_amount: e.tax_amount,
          total: e.total,
          notes: e.customer_concern
            ? `Concern: ${e.customer_concern}${e.notes ? `\n${e.notes}` : ""}`
            : e.notes,
          terms: e.terms,
        }}
      />
    </div>
  );
}

function StatusForm({
  id,
  status,
  label,
  className,
}: {
  id: string;
  status: "sent" | "approved" | "declined" | "expired";
  label: string;
  className: string;
}) {
  return (
    <form action={setEstimateStatus.bind(null, id, status)}>
      <button className={className}>{label}</button>
    </form>
  );
}
