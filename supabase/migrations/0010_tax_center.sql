-- ===========================================================================
-- 0010_tax_center.sql
-- Tax Center: over-prepare a sole-proprietor / single-member-LLC auto shop for
-- tax time. Captures the full business + tax profile, quarterly estimated
-- payments, a mileage log, depreciable asset purchases, and the 1099 data we
-- need on vendors. Everything here is owner/admin-only (financial data).
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
