-- Online booking requests from the website assistant (Neon project
-- "joes-garage"). Applied once with the Neon console or MCP; safe to re-run.
--
-- One drop-off slot holds one car: the partial unique index makes the
-- database itself refuse a second active request for the same start time,
-- so two visitors can't book the same slot at the same moment.

create table if not exists booking_requests (
  id          uuid primary key default gen_random_uuid(),
  status      text not null default 'requested'
                check (status in ('requested', 'confirmed', 'declined', 'cancelled')),
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  name        text not null,
  phone       text not null,          -- 10 digits, no formatting
  email       text,
  vehicle     text,
  concern     text not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists booking_requests_one_active_per_slot
  on booking_requests (start_time)
  where status in ('requested', 'confirmed');

create index if not exists booking_requests_start_idx on booking_requests (start_time);
create index if not exists booking_requests_phone_created_idx on booking_requests (phone, created_at);
create index if not exists booking_requests_created_idx on booking_requests (created_at);
