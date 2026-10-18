-- Attempts to unlock Joe's /requests page, shared by every server instance so
-- the PIN can't be brute-forced with parallel or distributed requests.
-- Rows older than a day are deleted by the app as it goes. Safe to re-run.

create table if not exists pin_attempts (
  id            bigint generated always as identity primary key,
  ip            text not null,
  attempted_at  timestamptz not null default now()
);

create index if not exists pin_attempts_time_idx on pin_attempts (attempted_at);
create index if not exists pin_attempts_ip_time_idx on pin_attempts (ip, attempted_at);
