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
