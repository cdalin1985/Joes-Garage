import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Alert } from "@/components/ui";
import { ExpenseImporter } from "@/components/forms/ExpenseImporter";
import { importExpenses } from "@/lib/actions/expense-import";
import type { ExpenseCategory } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function ImportExpensesPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  const categories = (data as ExpenseCategory[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Import expenses"
        subtitle="Upload a bank or credit-card statement instead of typing each one"
        backHref="/accounting"
      />

      <div className="mb-5">
        <Alert tone="blue" title="How it works">
          Download your transactions as a <strong>CSV</strong> from your bank or card website, choose
          the file below, review the categories we suggest, and import. Each row becomes an expense on
          your books — and flows straight into the Schedule C at tax time. Deposits and credits are
          skipped automatically.
        </Alert>
      </div>

      <ExpenseImporter action={importExpenses} categories={categories} />
    </div>
  );
}
