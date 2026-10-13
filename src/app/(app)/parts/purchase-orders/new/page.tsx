import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { PurchaseOrderEditor } from "@/components/forms/PurchaseOrderEditor";
import { createPurchaseOrder } from "@/lib/actions/purchase-orders";
import type { Part, Vendor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage() {
  const supabase = createClient();

  const [{ data: vendorData }, { data: partData }] = await Promise.all([
    supabase.from("vendors").select("*").eq("is_active", true).order("name"),
    supabase.from("parts").select("*").eq("is_active", true).order("name"),
  ]);
  const vendors = (vendorData as Vendor[]) ?? [];
  const parts = (partData as Part[]) ?? [];

  return (
    <div>
      <PageHeader title="New Purchase Order" backHref="/parts/purchase-orders" />
      <PurchaseOrderEditor
        action={createPurchaseOrder}
        vendors={vendors}
        parts={parts}
        defaults={{ items: [] }}
        cancelHref="/parts/purchase-orders"
      />
    </div>
  );
}
