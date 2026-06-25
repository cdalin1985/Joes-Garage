import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { updateExpense } from "@/lib/actions/expenses";
import type { Expense, ExpenseCategory } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const [{ data: expense }, { data: cats }] = await Promise.all([
    supabase.from("expenses").select("*").eq("id", params.id).single(),
    supabase.from("expense_categories").select("*").eq("is_active", true).order("sort_order"),
  ]);
  if (!expense) notFound();

  const action = updateExpense.bind(null, params.id);

  return (
    <div>
      <PageHeader title="Edit expense" backHref="/accounting" />
      <ExpenseForm
        action={action}
        categories={(cats as ExpenseCategory[]) ?? []}
        expense={expense as Expense}
        cancelHref="/accounting"
      />
    </div>
  );
}
