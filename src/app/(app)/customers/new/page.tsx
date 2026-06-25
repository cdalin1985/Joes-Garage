import { PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { createCustomer } from "@/lib/actions/customers";

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader title="New customer" backHref="/customers" />
      <CustomerForm action={createCustomer} cancelHref="/customers" />
    </div>
  );
}
