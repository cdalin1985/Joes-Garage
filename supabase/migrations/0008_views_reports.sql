-- ===========================================================================
-- 0008_views_reports.sql
-- Reporting views for dashboard KPIs and tax-time summaries.
--
-- All views use security_invoker so Row Level Security on the underlying
-- tables is enforced for the querying user (financial data stays admin-only).
-- ===========================================================================

-- Revenue is recognized on a CASH basis (when payment is received) — the most
-- common basis for a small shop and the simplest for tax time.

-- Monthly income from customer payments.
create or replace view public.v_income_by_month
with (security_invoker = true) as
select
  date_trunc('month', p.paid_at)::date as month,
  sum(p.amount)                        as income
from public.payments p
group by 1
order by 1;

-- Monthly expenses.
create or replace view public.v_expenses_by_month
with (security_invoker = true) as
select
  date_trunc('month', e.expense_date)::date as month,
  sum(e.amount)                             as expenses
from public.expenses e
group by 1
order by 1;

-- Combined monthly profit & loss.
create or replace view public.v_profit_loss_by_month
with (security_invoker = true) as
select
  coalesce(i.month, x.month)         as month,
  coalesce(i.income, 0)              as income,
  coalesce(x.expenses, 0)            as expenses,
  coalesce(i.income, 0) - coalesce(x.expenses, 0) as net_profit
from public.v_income_by_month i
full outer join public.v_expenses_by_month x on i.month = x.month
order by 1;

-- Sales tax collected (a liability owed to the state) by month, from paid
-- invoices. Pro-rated by how much of each invoice has actually been paid.
create or replace view public.v_sales_tax_by_month
with (security_invoker = true) as
select
  date_trunc('month', p.paid_at)::date as month,
  sum(
    p.amount * case when inv.total > 0 then inv.tax_amount / inv.total else 0 end
  ) as sales_tax_collected
from public.payments p
join public.invoices inv on inv.id = p.invoice_id
group by 1
order by 1;

-- Expense breakdown by category (with tax line) by year.
create or replace view public.v_expense_by_category
with (security_invoker = true) as
select
  ec.id                          as category_id,
  ec.name                        as category,
  ec.schedule_c_line,
  ec.tax_deductible,
  extract(year from e.expense_date)::int as year,
  sum(e.amount)                  as total
from public.expenses e
left join public.expense_categories ec on ec.id = e.category_id
group by ec.id, ec.name, ec.schedule_c_line, ec.tax_deductible, extract(year from e.expense_date)
order by total desc;

-- Accounts receivable: outstanding invoice balances.
create or replace view public.v_accounts_receivable
with (security_invoker = true) as
select
  inv.id,
  inv.number,
  inv.customer_id,
  inv.issue_date,
  inv.due_date,
  inv.total,
  inv.amount_paid,
  inv.balance_due,
  inv.status,
  case
    when inv.due_date is null then null
    else current_date - inv.due_date
  end as days_overdue
from public.invoices inv
where inv.status not in ('paid', 'void')
  and inv.balance_due > 0
order by inv.due_date nulls last;

-- Per-vehicle service history (work orders + invoices).
create or replace view public.v_vehicle_service_history
with (security_invoker = true) as
select
  wo.vehicle_id,
  wo.id            as work_order_id,
  wo.number        as work_order_number,
  wo.status,
  wo.customer_concern,
  wo.work_performed,
  wo.odometer_in,
  wo.completed_at,
  wo.invoice_id,
  inv.number       as invoice_number,
  inv.total        as invoice_total,
  wo.created_at
from public.work_orders wo
left join public.invoices inv on inv.id = wo.invoice_id
order by wo.created_at desc;
