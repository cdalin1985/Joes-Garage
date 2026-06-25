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
