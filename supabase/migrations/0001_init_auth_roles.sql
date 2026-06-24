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
