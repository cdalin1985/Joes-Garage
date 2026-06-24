import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { updateCustomer } from "@/lib/actions/customers";
import type { Customer } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("customers").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const customer = data as Customer;

  const action = updateCustomer.bind(null, params.id);

  return (
    <div>
      <PageHeader title="Edit customer" backHref={`/customers/${params.id}`} />
      <CustomerForm action={action} customer={customer} cancelHref={`/customers/${params.id}`} />
    </div>
  );
}
