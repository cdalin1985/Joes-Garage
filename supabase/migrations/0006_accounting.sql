-- ===========================================================================
-- 0006_accounting.sql
-- Expense tracking + tax categorization (Schedule C friendly).
-- ===========================================================================

create table if not exists public.expense_categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  -- Maps spending to an IRS Schedule C line to make tax time painless.
  schedule_c_line text,
  tax_deductible boolean not null default true,
  is_active      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  expense_date   date not null default current_date,
  vendor_id      uuid references public.vendors(id) on delete set null,
  vendor_name    text,            -- free-text fallback when no vendor record
  category_id    uuid references public.expense_categories(id) on delete set null,
  amount         numeric(12, 2) not null default 0,
  tax_amount     numeric(12, 2) not null default 0,  -- sales tax the shop paid
  payment_method public.payment_method not null default 'card',
  reference      text,
  description    text,
  receipt_url    text,
  -- Optional job costing: tie a cost back to a work order.
  work_order_id  uuid references public.work_orders(id) on delete set null,
  is_billable    boolean not null default false,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_expenses_date on public.expenses (expense_date);
create index if not exists idx_expenses_category on public.expenses (category_id);
create index if not exists idx_expenses_vendor on public.expenses (vendor_id);

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed a sensible default chart of expense categories.
-- ---------------------------------------------------------------------------
insert into public.expense_categories (name, schedule_c_line, sort_order) values
  ('Parts & Materials (COGS)', 'Part III - Cost of Goods Sold', 10),
  ('Shop Supplies',            'Line 22 - Supplies', 20),
  ('Tools & Equipment',        'Line 13 - Depreciation / Sec 179', 30),
  ('Rent / Lease',             'Line 20b - Rent (other business property)', 40),
  ('Utilities',                'Line 25 - Utilities', 50),
  ('Insurance',                'Line 15 - Insurance', 60),
  ('Wages / Payroll',          'Line 26 - Wages', 70),
  ('Advertising & Marketing',  'Line 8 - Advertising', 80),
  ('Vehicle & Fuel',           'Line 9 - Car and truck expenses', 90),
  ('Software & Subscriptions',  'Line 27a - Other expenses', 100),
  ('Professional Services',    'Line 17 - Legal & professional', 110),
  ('Taxes & Licenses',         'Line 23 - Taxes and licenses', 120),
  ('Bank & Merchant Fees',     'Line 27a - Other expenses', 130),
  ('Office Expense',           'Line 18 - Office expense', 140),
  ('Other',                    'Line 27a - Other expenses', 999)
on conflict do nothing;
