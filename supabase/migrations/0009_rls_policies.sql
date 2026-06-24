-- ===========================================================================
-- 0009_rls_policies.sql
-- Row Level Security. Operational data = all active staff; financial data and
-- settings = owner/admin only.
-- ===========================================================================

-- Enable RLS everywhere.
alter table public.profiles            enable row level security;
alter table public.shop_settings       enable row level security;
alter table public.customers           enable row level security;
alter table public.vehicles            enable row level security;
alter table public.estimates           enable row level security;
alter table public.estimate_items      enable row level security;
alter table public.invoices            enable row level security;
alter table public.invoice_items       enable row level security;
alter table public.payments            enable row level security;
alter table public.work_orders         enable row level security;
alter table public.work_order_items    enable row level security;
alter table public.parts               enable row level security;
alter table public.vendors             enable row level security;
alter table public.expense_categories  enable row level security;
alter table public.expenses            enable row level security;
alter table public.appointments        enable row level security;
alter table public.activity_log        enable row level security;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (public.is_staff());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Prevent non-admins from escalating their own role or reactivating themselves.
create or replace function public.guard_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.hourly_rate is distinct from old.hourly_rate then
      raise exception 'Only an owner or admin can change role, active status, or pay rate.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_changes on public.profiles;
create trigger trg_guard_profile_changes
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- ---------------------------------------------------------------------------
-- Shop settings: everyone reads, admins write.
-- ---------------------------------------------------------------------------
drop policy if exists shop_settings_select on public.shop_settings;
create policy shop_settings_select on public.shop_settings
  for select to authenticated using (public.is_staff());

drop policy if exists shop_settings_admin_write on public.shop_settings;
create policy shop_settings_admin_write on public.shop_settings
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Operational tables: any active staff member has full access.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  op_tables text[] := array[
    'customers', 'vehicles', 'estimates', 'estimate_items',
    'invoices', 'invoice_items', 'payments', 'work_orders',
    'work_order_items', 'parts', 'vendors', 'appointments', 'activity_log'
  ];
begin
  foreach t in array op_tables loop
    execute format('drop policy if exists %I on public.%I', 'staff_all_' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      'staff_all_' || t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Accounting: expense categories readable by staff, but financial records
-- (expenses) and category management are restricted to owner/admin.
-- ---------------------------------------------------------------------------
drop policy if exists expense_categories_select on public.expense_categories;
create policy expense_categories_select on public.expense_categories
  for select to authenticated using (public.is_staff());

drop policy if exists expense_categories_admin_write on public.expense_categories;
create policy expense_categories_admin_write on public.expense_categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists expenses_admin_all on public.expenses;
create policy expenses_admin_all on public.expenses
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
