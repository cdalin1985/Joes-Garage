import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { createExpense } from "@/lib/actions/expenses";
import type { ExpenseCategory } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
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
      <PageHeader title="Add expense" backHref="/accounting" />
      <ExpenseForm action={createExpense} categories={categories} cancelHref="/accounting" />
    </div>
  );
}
