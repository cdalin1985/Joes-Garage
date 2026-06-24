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
