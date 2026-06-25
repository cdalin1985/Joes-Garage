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
