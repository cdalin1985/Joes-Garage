-- ===========================================================================
-- 0011_shop_management.sql
-- Closes the remaining gaps vs. a dedicated shop-management system
-- (NAPA TRACS) + its QuickBooks bridge (Accounting Link):
--   * Digital vehicle inspections (DVI) with photos + a customer share link
--   * Purchase orders for parts (vendor ordering workflow)
--   * A labor rate book / canned-jobs library (flat-rate-guide substitute)
--   * A customer communications log (call/text/email follow-ups)
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
