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
