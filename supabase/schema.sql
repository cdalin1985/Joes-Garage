-- ===========================================================================
-- Joe's Garage — COMBINED SCHEMA
-- Generated from supabase/migrations/*.sql
--
-- HOW TO APPLY:
--   1. Open your Supabase project -> SQL Editor -> New query
--   2. Paste this entire file and click RUN.
--   3. (Optional) Repeat with supabase/seed.sql for demo data.
-- ===========================================================================


-- >>> supabase/migrations/0001_init_auth_roles.sql
-- ===========================================================================
-- 0001_init_auth_roles.sql
-- Foundation: extensions, roles/profiles, shop settings, helper functions.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('owner', 'admin', 'mechanic', 'front_desk');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  full_name   text,
  role        public.user_role not null default 'front_desk',
  phone       text,
  -- Default labor billing/cost rate used when this user logs time.
  hourly_rate numeric(10, 2),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Staff accounts for Joe''s Garage. Linked to Supabase auth users.';

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helper functions (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin') and is_active
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a new auth user is created.
-- The very first user to sign up becomes the shop owner.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.user_role;
begin
  if (select count(*) from public.profiles) = 0 then
    assigned_role := 'owner';
  else
    assigned_role := coalesce(
      (new.raw_user_meta_data ->> 'role')::public.user_role,
      'front_desk'
    );
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    assigned_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Shop settings (singleton row, id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.shop_settings (
  id                integer primary key default 1,
  shop_name         text not null default 'Joe''s Garage',
  legal_name        text,
  email             text,
  phone             text,
  website           text,
  address_line1     text,
  address_line2     text,
  city              text,
  state             text,
  postal_code       text,
  logo_url          text,
  -- Defaults applied to new documents
  default_tax_rate  numeric(6, 4) not null default 0.0000,  -- e.g. 0.0825 = 8.25%
  default_labor_rate numeric(10, 2) not null default 120.00,
  invoice_prefix    text not null default 'INV-',
  estimate_prefix   text not null default 'EST-',
  work_order_prefix text not null default 'WO-',
  invoice_terms     text default 'Payment due within 15 days. Thank you for your business!',
  estimate_terms    text default 'Estimate valid for 30 days. Prices subject to change based on final diagnosis.',
  ein               text,             -- federal tax id
  tax_id            text,             -- state sales tax id
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint shop_settings_singleton check (id = 1)
);

drop trigger if exists trg_shop_settings_updated_at on public.shop_settings;
create trigger trg_shop_settings_updated_at
  before update on public.shop_settings
  for each row execute function public.set_updated_at();

insert into public.shop_settings (id) values (1)
  on conflict (id) do nothing;


-- >>> supabase/migrations/0002_crm.sql
-- ===========================================================================
-- 0002_crm.sql
-- Customers & Vehicles (CRM)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  first_name    text,
  last_name     text,
  company       text,
  email         text,
  phone         text,
  mobile        text,
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  postal_code   text,
  -- 'fleet' customers (companies with many vehicles) vs individuals
  customer_type text not null default 'individual'
                  check (customer_type in ('individual', 'fleet', 'commercial')),
  tax_exempt    boolean not null default false,
  preferred_contact text default 'phone'
                  check (preferred_contact in ('phone', 'email', 'text', 'any')),
  notes         text,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_customers_name on public.customers (last_name, first_name);
create index if not exists idx_customers_company on public.customers (company);
create index if not exists idx_customers_email on public.customers (email);
create index if not exists idx_customers_phone on public.customers (phone);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- Convenience computed full name (for display/search)
create or replace function public.customer_display_name(c public.customers)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')), ''),
    c.company,
    'Unnamed Customer'
  );
$$;

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
create table if not exists public.vehicles (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  year          integer,
  make          text,
  model         text,
  trim          text,
  vin           text,
  license_plate text,
  license_state text,
  color         text,
  mileage       integer,
  engine        text,
  transmission  text,
  drivetrain    text,
  unit_number   text,        -- for fleet vehicles
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_vehicles_customer on public.vehicles (customer_id);
create index if not exists idx_vehicles_vin on public.vehicles (vin);
create index if not exists idx_vehicles_plate on public.vehicles (license_plate);

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create or replace function public.vehicle_display_name(v public.vehicles)
returns text
language sql
immutable
as $$
  select nullif(trim(
    coalesce(v.year::text, '') || ' ' ||
    coalesce(v.make, '') || ' ' ||
    coalesce(v.model, '') || ' ' ||
    coalesce(v.trim, '')
  ), '');
$$;


-- >>> supabase/migrations/0003_estimates_invoices.sql
-- ===========================================================================
-- 0003_estimates_invoices.sql
-- Estimates, Invoices, line items, payments, auto-numbering, total recalc.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Document numbering sequences
-- ---------------------------------------------------------------------------
create sequence if not exists public.estimate_number_seq start 1001;
create sequence if not exists public.invoice_number_seq  start 1001;

-- Line item type shared by estimates, invoices, work orders
do $$ begin
  create type public.line_item_type as enum ('labor', 'part', 'sublet', 'fee', 'discount');
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- ESTIMATES
-- ===========================================================================
do $$ begin
  create type public.estimate_status as enum
    ('draft', 'sent', 'approved', 'declined', 'expired', 'converted');
exception when duplicate_object then null; end $$;

create table if not exists public.estimates (
  id           uuid primary key default gen_random_uuid(),
  number       text unique,
  customer_id  uuid references public.customers(id) on delete set null,
  vehicle_id   uuid references public.vehicles(id) on delete set null,
  status       public.estimate_status not null default 'draft',
  issue_date   date not null default current_date,
  expiry_date  date,
  -- Money fields recomputed by trigger from line items
  subtotal     numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  tax_rate     numeric(6, 4) not null default 0,
  tax_amount   numeric(12, 2) not null default 0,
  total        numeric(12, 2) not null default 0,
  customer_concern text,
  notes        text,
  terms        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_estimates_customer on public.estimates (customer_id);
create index if not exists idx_estimates_vehicle on public.estimates (vehicle_id);
create index if not exists idx_estimates_status on public.estimates (status);

create table if not exists public.estimate_items (
  id           uuid primary key default gen_random_uuid(),
  estimate_id  uuid not null references public.estimates(id) on delete cascade,
  item_type    public.line_item_type not null default 'labor',
  description  text not null default '',
  part_id      uuid,  -- optional link to inventory (FK added in 0005)
  quantity     numeric(12, 2) not null default 1,
  unit_price   numeric(12, 2) not null default 0,
  taxable      boolean not null default true,
  line_total   numeric(12, 2) generated always as (round(quantity * unit_price, 2)) stored,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_estimate_items_estimate on public.estimate_items (estimate_id);

-- ===========================================================================
-- INVOICES
-- ===========================================================================
do $$ begin
  create type public.invoice_status as enum
    ('draft', 'sent', 'partial', 'paid', 'overdue', 'void');
exception when duplicate_object then null; end $$;

create table if not exists public.invoices (
  id            uuid primary key default gen_random_uuid(),
  number        text unique,
  customer_id   uuid references public.customers(id) on delete set null,
  vehicle_id    uuid references public.vehicles(id) on delete set null,
  estimate_id   uuid references public.estimates(id) on delete set null,
  status        public.invoice_status not null default 'draft',
  issue_date    date not null default current_date,
  due_date      date,
  subtotal      numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  tax_rate      numeric(6, 4) not null default 0,
  tax_amount    numeric(12, 2) not null default 0,
  total         numeric(12, 2) not null default 0,
  amount_paid   numeric(12, 2) not null default 0,
  balance_due   numeric(12, 2) not null default 0,
  notes         text,
  terms         text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_invoices_customer on public.invoices (customer_id);
create index if not exists idx_invoices_vehicle on public.invoices (vehicle_id);
create index if not exists idx_invoices_status on public.invoices (status);
create index if not exists idx_invoices_issue_date on public.invoices (issue_date);

create table if not exists public.invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  item_type    public.line_item_type not null default 'labor',
  description  text not null default '',
  part_id      uuid,
  quantity     numeric(12, 2) not null default 1,
  unit_price   numeric(12, 2) not null default 0,
  taxable      boolean not null default true,
  line_total   numeric(12, 2) generated always as (round(quantity * unit_price, 2)) stored,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_invoice_items_invoice on public.invoice_items (invoice_id);

-- ===========================================================================
-- PAYMENTS
-- ===========================================================================
do $$ begin
  create type public.payment_method as enum
    ('cash', 'card', 'check', 'ach', 'financing', 'other');
exception when duplicate_object then null; end $$;

create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  amount      numeric(12, 2) not null,
  method      public.payment_method not null default 'card',
  reference   text,
  paid_at     date not null default current_date,
  notes       text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_payments_invoice on public.payments (invoice_id);
create index if not exists idx_payments_paid_at on public.payments (paid_at);

-- ===========================================================================
-- Auto-numbering triggers
-- ===========================================================================
create or replace function public.assign_estimate_number()
returns trigger
language plpgsql
as $$
declare
  prefix text;
begin
  if new.number is null then
    select estimate_prefix into prefix from public.shop_settings where id = 1;
    new.number := coalesce(prefix, 'EST-') || nextval('public.estimate_number_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_estimate_number on public.estimates;
create trigger trg_estimate_number
  before insert on public.estimates
  for each row execute function public.assign_estimate_number();

create or replace function public.assign_invoice_number()
returns trigger
language plpgsql
as $$
declare
  prefix text;
begin
  if new.number is null then
    select invoice_prefix into prefix from public.shop_settings where id = 1;
    new.number := coalesce(prefix, 'INV-') || nextval('public.invoice_number_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invoice_number on public.invoices;
create trigger trg_invoice_number
  before insert on public.invoices
  for each row execute function public.assign_invoice_number();

drop trigger if exists trg_estimates_updated_at on public.estimates;
create trigger trg_estimates_updated_at
  before update on public.estimates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Total recalculation
-- ===========================================================================

-- Estimates: recompute subtotal / discount / tax / total from line items.
create or replace function public.recalc_estimate_totals(p_estimate_id uuid)
returns void
language plpgsql
as $$
declare
  v_rate numeric(6, 4);
  v_subtotal numeric(12, 2);
  v_discount numeric(12, 2);
  v_taxable  numeric(12, 2);
begin
  select tax_rate into v_rate from public.estimates where id = p_estimate_id;

  select
    coalesce(sum(line_total), 0),
    coalesce(sum(case when item_type = 'discount' or line_total < 0 then line_total else 0 end), 0),
    coalesce(sum(case when taxable and item_type <> 'discount' then line_total else 0 end), 0)
  into v_subtotal, v_discount, v_taxable
  from public.estimate_items
  where estimate_id = p_estimate_id;

  update public.estimates
  set subtotal       = v_subtotal,
      discount_total = abs(v_discount),
      tax_amount     = round(greatest(v_taxable, 0) * coalesce(v_rate, 0), 2),
      total          = v_subtotal + round(greatest(v_taxable, 0) * coalesce(v_rate, 0), 2),
      updated_at     = now()
  where id = p_estimate_id;
end;
$$;

create or replace function public.trg_recalc_estimate()
returns trigger
language plpgsql
as $$
begin
  perform public.recalc_estimate_totals(coalesce(new.estimate_id, old.estimate_id));
  return null;
end;
$$;

drop trigger if exists trg_estimate_items_recalc on public.estimate_items;
create trigger trg_estimate_items_recalc
  after insert or update or delete on public.estimate_items
  for each row execute function public.trg_recalc_estimate();

-- Recompute when the estimate's tax_rate itself changes.
create or replace function public.trg_estimate_rate_change()
returns trigger
language plpgsql
as $$
begin
  if new.tax_rate is distinct from old.tax_rate then
    perform public.recalc_estimate_totals(new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_estimate_rate_recalc on public.estimates;
create trigger trg_estimate_rate_recalc
  after update on public.estimates
  for each row execute function public.trg_estimate_rate_change();

-- Invoices: recompute subtotal / tax / total / paid / balance / status.
create or replace function public.recalc_invoice_totals(p_invoice_id uuid)
returns void
language plpgsql
as $$
declare
  v_rate     numeric(6, 4);
  v_subtotal numeric(12, 2);
  v_discount numeric(12, 2);
  v_taxable  numeric(12, 2);
  v_tax      numeric(12, 2);
  v_total    numeric(12, 2);
  v_paid     numeric(12, 2);
  v_balance  numeric(12, 2);
  v_status   public.invoice_status;
  v_due      date;
begin
  select tax_rate, status, due_date
    into v_rate, v_status, v_due
    from public.invoices where id = p_invoice_id;

  select
    coalesce(sum(line_total), 0),
    coalesce(sum(case when item_type = 'discount' or line_total < 0 then line_total else 0 end), 0),
    coalesce(sum(case when taxable and item_type <> 'discount' then line_total else 0 end), 0)
  into v_subtotal, v_discount, v_taxable
  from public.invoice_items
  where invoice_id = p_invoice_id;

  v_tax   := round(greatest(v_taxable, 0) * coalesce(v_rate, 0), 2);
  v_total := v_subtotal + v_tax;

  select coalesce(sum(amount), 0) into v_paid
  from public.payments where invoice_id = p_invoice_id;

  v_balance := round(v_total - v_paid, 2);

  -- Status: don't override 'void'. Derive paid/partial/overdue otherwise.
  if v_status <> 'void' then
    if v_total > 0 and v_balance <= 0 then
      v_status := 'paid';
    elsif v_paid > 0 then
      v_status := 'partial';
    elsif v_due is not null and v_due < current_date then
      v_status := 'overdue';
    elsif v_status in ('paid', 'partial', 'overdue') then
      -- payments removed / dates changed back to outstanding
      v_status := 'sent';
    end if;
  end if;

  update public.invoices
  set subtotal       = v_subtotal,
      discount_total = abs(v_discount),
      tax_amount     = v_tax,
      total          = v_total,
      amount_paid    = v_paid,
      balance_due    = v_balance,
      status         = v_status,
      updated_at     = now()
  where id = p_invoice_id;
end;
$$;

create or replace function public.trg_recalc_invoice_items()
returns trigger
language plpgsql
as $$
begin
  perform public.recalc_invoice_totals(coalesce(new.invoice_id, old.invoice_id));
  return null;
end;
$$;

drop trigger if exists trg_invoice_items_recalc on public.invoice_items;
create trigger trg_invoice_items_recalc
  after insert or update or delete on public.invoice_items
  for each row execute function public.trg_recalc_invoice_items();

create or replace function public.trg_recalc_invoice_payments()
returns trigger
language plpgsql
as $$
begin
  perform public.recalc_invoice_totals(coalesce(new.invoice_id, old.invoice_id));
  return null;
end;
$$;

drop trigger if exists trg_payments_recalc on public.payments;
create trigger trg_payments_recalc
  after insert or update or delete on public.payments
  for each row execute function public.trg_recalc_invoice_payments();

create or replace function public.trg_invoice_rate_change()
returns trigger
language plpgsql
as $$
begin
  if new.tax_rate is distinct from old.tax_rate or new.due_date is distinct from old.due_date then
    perform public.recalc_invoice_totals(new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_invoice_rate_recalc on public.invoices;
create trigger trg_invoice_rate_recalc
  after update on public.invoices
  for each row execute function public.trg_invoice_rate_change();


-- >>> supabase/migrations/0004_work_orders.sql
-- ===========================================================================
-- 0004_work_orders.sql
-- Jobs / Work Orders and their line items (services, parts, labor, sublet).
-- ===========================================================================

create sequence if not exists public.work_order_number_seq start 1001;

do $$ begin
  create type public.work_order_status as enum (
    'estimate',        -- not yet authorized
    'scheduled',       -- booked in
    'intake',          -- vehicle dropped off / checking in
    'in_progress',     -- being worked on
    'awaiting_parts',  -- waiting on parts
    'awaiting_approval', -- waiting on customer authorization
    'completed',       -- work finished
    'delivered',       -- vehicle returned to customer
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.work_order_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

create table if not exists public.work_orders (
  id              uuid primary key default gen_random_uuid(),
  number          text unique,
  customer_id     uuid references public.customers(id) on delete set null,
  vehicle_id      uuid references public.vehicles(id) on delete set null,
  status          public.work_order_status not null default 'intake',
  priority        public.work_order_priority not null default 'normal',
  assigned_to     uuid references public.profiles(id) on delete set null,
  -- Diagnostics workflow
  customer_concern text,       -- what the customer reported
  diagnosis        text,       -- what the tech found
  work_performed   text,       -- summary of work done
  recommendations  text,       -- future / declined work
  odometer_in      integer,
  odometer_out     integer,
  -- Scheduling
  promised_at      timestamptz,
  scheduled_for    timestamptz,
  started_at       timestamptz,
  completed_at     timestamptz,
  -- Links to financial docs
  estimate_id      uuid references public.estimates(id) on delete set null,
  invoice_id       uuid references public.invoices(id) on delete set null,
  notes            text,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_work_orders_customer on public.work_orders (customer_id);
create index if not exists idx_work_orders_vehicle on public.work_orders (vehicle_id);
create index if not exists idx_work_orders_status on public.work_orders (status);
create index if not exists idx_work_orders_assigned on public.work_orders (assigned_to);

-- Individual jobs / tasks / parts on a work order.
create table if not exists public.work_order_items (
  id             uuid primary key default gen_random_uuid(),
  work_order_id  uuid not null references public.work_orders(id) on delete cascade,
  item_type      public.line_item_type not null default 'labor',
  description    text not null default '',
  part_id        uuid,
  -- For labor lines, quantity = billed hours.
  quantity       numeric(12, 2) not null default 1,
  unit_price     numeric(12, 2) not null default 0,
  taxable        boolean not null default true,
  -- Tech assignment + completion tracking per line.
  technician_id  uuid references public.profiles(id) on delete set null,
  is_complete    boolean not null default false,
  line_total     numeric(12, 2) generated always as (round(quantity * unit_price, 2)) stored,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_wo_items_wo on public.work_order_items (work_order_id);

drop trigger if exists trg_work_orders_updated_at on public.work_orders;
create trigger trg_work_orders_updated_at
  before update on public.work_orders
  for each row execute function public.set_updated_at();

create or replace function public.assign_work_order_number()
returns trigger
language plpgsql
as $$
declare
  prefix text;
begin
  if new.number is null then
    select work_order_prefix into prefix from public.shop_settings where id = 1;
    new.number := coalesce(prefix, 'WO-') || nextval('public.work_order_number_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_work_order_number on public.work_orders;
create trigger trg_work_order_number
  before insert on public.work_orders
  for each row execute function public.assign_work_order_number();

-- Stamp lifecycle timestamps automatically as status changes.
create or replace function public.trg_work_order_status_stamps()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'in_progress' and old.status is distinct from 'in_progress'
     and new.started_at is null then
    new.started_at := now();
  end if;
  if new.status in ('completed', 'delivered') and new.completed_at is null then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_wo_status_stamps on public.work_orders;
create trigger trg_wo_status_stamps
  before update on public.work_orders
  for each row execute function public.trg_work_order_status_stamps();

-- Activity log (shared across modules) for an audit trail.
create table if not exists public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  entity_type  text not null,   -- 'work_order' | 'invoice' | 'estimate' | 'customer' ...
  entity_id    uuid,
  action       text not null,   -- 'created' | 'status_changed' | 'note' ...
  detail       text,
  actor_id     uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_activity_entity on public.activity_log (entity_type, entity_id);


-- >>> supabase/migrations/0005_inventory.sql
-- ===========================================================================
-- 0005_inventory.sql
-- Parts inventory + vendors/suppliers.
-- ===========================================================================

create table if not exists public.vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact_name text,
  email       text,
  phone       text,
  website     text,
  account_number text,
  address     text,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_vendors_updated_at on public.vendors;
create trigger trg_vendors_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

create table if not exists public.parts (
  id              uuid primary key default gen_random_uuid(),
  part_number     text,
  name            text not null,
  description     text,
  category        text,
  brand           text,
  vendor_id       uuid references public.vendors(id) on delete set null,
  cost            numeric(12, 2) not null default 0,   -- what the shop pays
  price           numeric(12, 2) not null default 0,   -- what the customer pays
  quantity_on_hand numeric(12, 2) not null default 0,
  reorder_level   numeric(12, 2) not null default 0,
  bin_location    text,
  taxable         boolean not null default true,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_parts_number on public.parts (part_number);
create index if not exists idx_parts_name on public.parts (name);
create index if not exists idx_parts_category on public.parts (category);

drop trigger if exists trg_parts_updated_at on public.parts;
create trigger trg_parts_updated_at
  before update on public.parts
  for each row execute function public.set_updated_at();

-- Now that parts exists, wire up the optional part_id FKs on line-item tables.
alter table public.estimate_items
  drop constraint if exists fk_estimate_items_part;
alter table public.estimate_items
  add constraint fk_estimate_items_part
  foreign key (part_id) references public.parts(id) on delete set null;

alter table public.invoice_items
  drop constraint if exists fk_invoice_items_part;
alter table public.invoice_items
  add constraint fk_invoice_items_part
  foreign key (part_id) references public.parts(id) on delete set null;

alter table public.work_order_items
  drop constraint if exists fk_wo_items_part;
alter table public.work_order_items
  add constraint fk_wo_items_part
  foreign key (part_id) references public.parts(id) on delete set null;


-- >>> supabase/migrations/0006_accounting.sql
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


-- >>> supabase/migrations/0007_appointments.sql
-- ===========================================================================
-- 0007_appointments.sql
-- Scheduling / appointment book.
-- ===========================================================================

do $$ begin
  create type public.appointment_status as enum
    ('scheduled', 'confirmed', 'in_shop', 'completed', 'no_show', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid references public.customers(id) on delete set null,
  vehicle_id    uuid references public.vehicles(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  assigned_to   uuid references public.profiles(id) on delete set null,
  title         text not null default 'Service Appointment',
  description   text,
  status        public.appointment_status not null default 'scheduled',
  start_time    timestamptz not null,
  end_time      timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_appointments_start on public.appointments (start_time);
create index if not exists idx_appointments_customer on public.appointments (customer_id);

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();


-- >>> supabase/migrations/0008_views_reports.sql
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


-- >>> supabase/migrations/0009_rls_policies.sql
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



-- ===========================================================================
-- Tax Center (mirrors migration 0010_tax_center.sql)
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.entity_type as enum (
    'sole_prop', 'single_llc', 'partnership', 'multi_llc', 's_corp', 'c_corp'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.filing_status as enum (
    'single', 'mfj', 'mfs', 'hoh', 'qw'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.accounting_method as enum ('cash', 'accrual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mileage_method as enum ('standard', 'actual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_category as enum (
    'vehicle', 'machinery', 'tools', 'computers', 'furniture', 'building', 'improvement', 'other'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Business + tax profile (singleton, row id = 1)
-- This is the over-collected "everything an accountant would ask you" record.
-- ---------------------------------------------------------------------------
create table if not exists public.tax_profile (
  id                       integer primary key default 1,

  -- Entity & identity
  entity_type              public.entity_type not null default 'sole_prop',
  legal_business_name      text,
  dba_name                 text,
  ein                      text,                 -- federal employer id
  owner_ssn_last4          text,                 -- only last 4 stored, for reference
  naics_code               text default '811111',-- "General Automotive Repair"
  business_description      text default 'Automotive repair and maintenance',
  business_start_date      date,
  state_of_operation       text,
  state_tax_id             text,
  state_unemployment_id    text,

  -- How the books are kept
  accounting_method        public.accounting_method not null default 'cash',
  first_year_filing        boolean not null default false,
  materially_participates  boolean not null default true,
  has_employees            boolean not null default false,
  files_1099               boolean not null default false,
  made_payments_req_1099   boolean,              -- Sch C question I, line for 1099s

  -- Owner / household (drives the income-tax estimate)
  owner_full_name          text,
  filing_status            public.filing_status not null default 'single',
  spouse_name              text,
  spouse_w2_income         numeric(12,2) not null default 0,
  other_household_income   numeric(12,2) not null default 0,
  dependents               integer not null default 0,
  prior_year_agi           numeric(12,2) not null default 0,
  prior_year_total_tax     numeric(12,2) not null default 0,
  est_other_deductions     numeric(12,2) not null default 0, -- above standard, if itemizing
  use_itemized             boolean not null default false,
  itemized_deductions      numeric(12,2) not null default 0,

  -- Self-employed perks the owner usually forgets
  sep_simple_401k_contrib  numeric(12,2) not null default 0,  -- retirement
  health_insurance_premium numeric(12,2) not null default 0,  -- SE health-ins deduction
  hsa_contribution         numeric(12,2) not null default 0,

  -- Home office (simplified method by default)
  has_home_office          boolean not null default false,
  home_office_sqft         integer not null default 0,
  home_total_sqft          integer not null default 0,
  home_office_use_simplified boolean not null default true,
  home_rent_mortgage_year  numeric(12,2) not null default 0,
  home_utilities_year      numeric(12,2) not null default 0,
  home_insurance_year      numeric(12,2) not null default 0,
  home_repairs_year        numeric(12,2) not null default 0,

  -- Business vehicle (if a single shop vehicle is tracked here)
  vehicle_description      text,
  vehicle_in_service_date  date,
  vehicle_method           public.mileage_method not null default 'standard',
  vehicle_total_miles      integer not null default 0,
  vehicle_commute_miles    integer not null default 0,
  vehicle_actual_expenses  numeric(12,2) not null default 0,
  vehicle_has_another      boolean not null default true,

  -- Estimated-tax preferences
  pay_state_estimates      boolean not null default false,
  state_tax_rate           numeric(6,4) not null default 0.0000, -- e.g. 0.05 = 5%
  safe_harbor_target       integer not null default 100,         -- 90, 100, or 110 (%)

  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint tax_profile_singleton check (id = 1)
);

insert into public.tax_profile (id) values (1) on conflict do nothing;

drop trigger if exists trg_tax_profile_updated_at on public.tax_profile;
create trigger trg_tax_profile_updated_at
  before update on public.tax_profile
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Quarterly estimated tax payments (Form 1040-ES + state)
-- ---------------------------------------------------------------------------
create table if not exists public.estimated_tax_payments (
  id            uuid primary key default gen_random_uuid(),
  tax_year      integer not null,
  quarter       integer not null check (quarter between 1 and 4),
  jurisdiction  text not null default 'federal',  -- 'federal' | 'state'
  amount        numeric(12,2) not null default 0,
  paid_date     date,
  confirmation  text,
  notes         text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_est_pay_year on public.estimated_tax_payments (tax_year);

drop trigger if exists trg_est_pay_updated_at on public.estimated_tax_payments;
create trigger trg_est_pay_updated_at
  before update on public.estimated_tax_payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Mileage log (business miles, standard-rate deduction)
-- ---------------------------------------------------------------------------
create table if not exists public.mileage_logs (
  id            uuid primary key default gen_random_uuid(),
  trip_date     date not null default current_date,
  miles         numeric(10,1) not null default 0,
  purpose       text,
  from_location text,
  to_location   text,
  odometer_start numeric(12,1),
  odometer_end   numeric(12,1),
  work_order_id uuid references public.work_orders(id) on delete set null,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_mileage_date on public.mileage_logs (trip_date);

drop trigger if exists trg_mileage_updated_at on public.mileage_logs;
create trigger trg_mileage_updated_at
  before update on public.mileage_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Capital asset purchases (depreciation / Section 179 / bonus)
-- ---------------------------------------------------------------------------
create table if not exists public.asset_purchases (
  id                uuid primary key default gen_random_uuid(),
  description       text not null,
  category          public.asset_category not null default 'tools',
  vendor_name       text,
  purchase_date     date not null default current_date,
  cost              numeric(12,2) not null default 0,
  business_use_pct  numeric(5,2) not null default 100,
  recovery_years    integer not null default 7,        -- MACRS class life
  section_179       boolean not null default false,     -- expense fully this year
  bonus_depreciation boolean not null default false,
  disposed_date     date,
  notes             text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_assets_date on public.asset_purchases (purchase_date);

drop trigger if exists trg_assets_updated_at on public.asset_purchases;
create trigger trg_assets_updated_at
  before update on public.asset_purchases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 1099 fields on vendors (so we can produce 1099-NEC at year end)
-- ---------------------------------------------------------------------------
alter table public.vendors add column if not exists is_1099 boolean not null default false;
alter table public.vendors add column if not exists tax_id text;            -- EIN or SSN
alter table public.vendors add column if not exists tax_id_type text;       -- 'ein' | 'ssn'
alter table public.vendors add column if not exists legal_name text;        -- name on the W-9
alter table public.vendors add column if not exists w9_on_file boolean not null default false;

-- ---------------------------------------------------------------------------
-- RLS: all of this is financial — owner/admin only.
-- ---------------------------------------------------------------------------
alter table public.tax_profile            enable row level security;
alter table public.estimated_tax_payments enable row level security;
alter table public.mileage_logs           enable row level security;
alter table public.asset_purchases        enable row level security;

do $$
declare
  t text;
  fin_tables text[] := array[
    'tax_profile', 'estimated_tax_payments', 'mileage_logs', 'asset_purchases'
  ];
begin
  foreach t in array fin_tables loop
    execute format('drop policy if exists %I on public.%I', 'admin_all_' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      'admin_all_' || t, t
    );
  end loop;
end $$;

-- ===========================================================================
-- Shop Management (mirrors migration 0011_shop_management.sql)
-- ===========================================================================

-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Digital vehicle inspections
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.inspection_status as enum ('in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inspection_rating as enum ('green', 'yellow', 'red', 'na');
exception when duplicate_object then null; end $$;

create table if not exists public.inspections (
  id            uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  vehicle_id    uuid references public.vehicles(id) on delete set null,
  status        public.inspection_status not null default 'in_progress',
  share_token   uuid not null default gen_random_uuid(),
  performed_by  uuid references public.profiles(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists idx_inspections_share_token on public.inspections (share_token);
create index if not exists idx_inspections_work_order on public.inspections (work_order_id);

drop trigger if exists trg_inspections_updated_at on public.inspections;
create trigger trg_inspections_updated_at
  before update on public.inspections
  for each row execute function public.set_updated_at();

create table if not exists public.inspection_items (
  id             uuid primary key default gen_random_uuid(),
  inspection_id  uuid not null references public.inspections(id) on delete cascade,
  category       text not null default 'General',
  label          text not null,
  rating         public.inspection_rating not null default 'na',
  notes          text,
  photo_url      text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_inspection_items_inspection on public.inspection_items (inspection_id);

-- Security-definer lookup so a customer holding the share link (no login)
-- can view their own inspection without granting anon broad table access.
create or replace function public.get_inspection_by_token(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', i.id,
    'status', i.status,
    'notes', i.notes,
    'created_at', i.created_at,
    'updated_at', i.updated_at,
    'work_order_number', wo.number,
    'technician', p.full_name,
    'vehicle', jsonb_build_object(
      'year', v.year, 'make', v.make, 'model', v.model, 'trim', v.trim, 'vin', v.vin
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category', ii.category,
        'label', ii.label,
        'rating', ii.rating,
        'notes', ii.notes,
        'photo_url', ii.photo_url,
        'sort_order', ii.sort_order
      ) order by ii.sort_order)
      from public.inspection_items ii where ii.inspection_id = i.id
    ), '[]'::jsonb)
  )
  into result
  from public.inspections i
  left join public.work_orders wo on wo.id = i.work_order_id
  left join public.vehicles v on v.id = i.vehicle_id
  left join public.profiles p on p.id = i.performed_by
  where i.share_token = p_token;

  return result;
end;
$$;

grant execute on function public.get_inspection_by_token(uuid) to anon, authenticated;

-- Photo storage for inspections (public bucket; only staff can write).
insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', true)
on conflict (id) do nothing;

drop policy if exists "inspection_photos_public_read" on storage.objects;
create policy "inspection_photos_public_read" on storage.objects
  for select using (bucket_id = 'inspection-photos');

drop policy if exists "inspection_photos_staff_write" on storage.objects;
create policy "inspection_photos_staff_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'inspection-photos' and public.is_staff());

drop policy if exists "inspection_photos_staff_update" on storage.objects;
create policy "inspection_photos_staff_update" on storage.objects
  for update to authenticated using (bucket_id = 'inspection-photos' and public.is_staff());

drop policy if exists "inspection_photos_staff_delete" on storage.objects;
create policy "inspection_photos_staff_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'inspection-photos' and public.is_staff());

-- ---------------------------------------------------------------------------
-- Purchase orders (vendor parts ordering)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.purchase_order_status as enum ('draft', 'ordered', 'partial', 'received', 'cancelled');
exception when duplicate_object then null; end $$;

create sequence if not exists public.purchase_order_number_seq start 1001;

create table if not exists public.purchase_orders (
  id            uuid primary key default gen_random_uuid(),
  number        text unique,
  vendor_id     uuid references public.vendors(id) on delete set null,
  status        public.purchase_order_status not null default 'draft',
  ordered_at    timestamptz,
  expected_at   timestamptz,
  received_at   timestamptz,
  notes         text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_po_vendor on public.purchase_orders (vendor_id);
create index if not exists idx_po_status on public.purchase_orders (status);

drop trigger if exists trg_purchase_orders_updated_at on public.purchase_orders;
create trigger trg_purchase_orders_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();

create or replace function public.assign_po_number()
returns trigger
language plpgsql
as $$
begin
  if new.number is null then
    new.number := 'PO-' || nextval('public.purchase_order_number_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_po_number on public.purchase_orders;
create trigger trg_po_number
  before insert on public.purchase_orders
  for each row execute function public.assign_po_number();

create table if not exists public.purchase_order_items (
  id                uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  part_id           uuid references public.parts(id) on delete set null,
  description       text not null default '',
  quantity_ordered  numeric(12, 2) not null default 1,
  quantity_received numeric(12, 2) not null default 0,
  unit_cost         numeric(12, 2) not null default 0,
  line_total        numeric(12, 2) generated always as (round(quantity_ordered * unit_cost, 2)) stored,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists idx_po_items_po on public.purchase_order_items (purchase_order_id);

-- Receiving a line bumps quantity_on_hand on the linked part automatically.
create or replace function public.trg_po_item_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.part_id is not null and new.quantity_received is distinct from old.quantity_received then
    update public.parts
    set quantity_on_hand = quantity_on_hand + (new.quantity_received - old.quantity_received)
    where id = new.part_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_po_items_received on public.purchase_order_items;
create trigger trg_po_items_received
  after update on public.purchase_order_items
  for each row execute function public.trg_po_item_received();

-- ---------------------------------------------------------------------------
-- Labor rate book (canned jobs) — an in-house substitute for a paid
-- flat-rate labor guide subscription. Owner/techs build their own library
-- of standard jobs with proven labor times.
-- ---------------------------------------------------------------------------
create table if not exists public.labor_presets (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text,
  default_hours numeric(6, 2) not null default 1,
  default_rate  numeric(12, 2),
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_labor_presets_category on public.labor_presets (category);

drop trigger if exists trg_labor_presets_updated_at on public.labor_presets;
create trigger trg_labor_presets_updated_at
  before update on public.labor_presets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Customer communications log (calls / texts / emails / notes)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.communication_type as enum ('call', 'text', 'email', 'note');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.communication_direction as enum ('outbound', 'inbound');
exception when duplicate_object then null; end $$;

create table if not exists public.customer_communications (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  type          public.communication_type not null default 'note',
  direction     public.communication_direction not null default 'outbound',
  summary       text not null,
  logged_by     uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_comm_customer on public.customer_communications (customer_id);
create index if not exists idx_comm_created on public.customer_communications (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.inspections             enable row level security;
alter table public.inspection_items         enable row level security;
alter table public.purchase_orders          enable row level security;
alter table public.purchase_order_items     enable row level security;
alter table public.labor_presets            enable row level security;
alter table public.customer_communications  enable row level security;

do $$
declare
  t text;
  op_tables text[] := array[
    'inspections', 'inspection_items', 'purchase_orders', 'purchase_order_items',
    'labor_presets', 'customer_communications'
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


-- >>> supabase/migrations/0012_pricing_matrix.sql
-- ===========================================================================
-- 0012_pricing_matrix.sql
-- Parts pricing matrix: tiered cost -> retail markup, so a part's price can be
-- derived from its cost automatically (mirrors NAPA TRACS's pricing matrix).
-- ===========================================================================

create table if not exists public.pricing_matrix_tiers (
  id                uuid primary key default gen_random_uuid(),
  cost_min          numeric(12, 2) not null default 0,
  cost_max          numeric(12, 2),
  markup_multiplier numeric(6, 3) not null default 1.0,
  label             text,
  sort_order        integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index if not exists idx_pricing_tiers_min on public.pricing_matrix_tiers (cost_min);

alter table public.pricing_matrix_tiers enable row level security;

do $$
begin
  drop policy if exists staff_all_pricing_matrix_tiers on public.pricing_matrix_tiers;
  create policy staff_all_pricing_matrix_tiers on public.pricing_matrix_tiers
    for all to authenticated using (public.is_staff()) with check (public.is_staff());
end $$;

do $$
begin
  if not exists (select 1 from public.pricing_matrix_tiers) then
    insert into public.pricing_matrix_tiers (cost_min, cost_max, markup_multiplier, label, sort_order) values
      (0,   5,    3.00, 'Small hardware',  1),
      (5,   25,   2.50, 'Common parts',    2),
      (25,  75,   2.00, 'Mid-range',       3),
      (75,  200,  1.70, 'Major components',4),
      (200, null, 1.50, 'High-cost',       5);
  end if;
end $$;
