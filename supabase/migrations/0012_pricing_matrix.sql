-- ===========================================================================
-- 0012_pricing_matrix.sql
-- Parts pricing matrix: tiered cost -> retail markup, so a part's price can be
-- derived from its cost automatically (mirrors NAPA TRACS's pricing matrix).
-- ===========================================================================

create table if not exists public.pricing_matrix_tiers (
  id                uuid primary key default gen_random_uuid(),
  cost_min          numeric(12, 2) not null default 0,   -- inclusive lower bound
  cost_max          numeric(12, 2),                      -- exclusive upper bound; null = no cap
  markup_multiplier numeric(6, 3) not null default 1.0,  -- price = cost * multiplier
  label             text,
  sort_order        integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index if not exists idx_pricing_tiers_min on public.pricing_matrix_tiers (cost_min);

alter table public.pricing_matrix_tiers enable row level security;

do $$
begin
  drop policy if exists staff_all_pricing_matrix_tiers on public.pricing_matrix_tiers;
  create policy staff_all_pricing_matrix_tiers on public.pricing_matrix_tiers
    for all to authenticated using (public.is_staff()) with check (public.is_staff());
end $$;

-- Sensible starter matrix (only if the shop hasn't defined one yet).
do $$
begin
  if not exists (select 1 from public.pricing_matrix_tiers) then
    insert into public.pricing_matrix_tiers (cost_min, cost_max, markup_multiplier, label, sort_order) values
      (0,   5,    3.00, 'Small hardware',  1),
      (5,   25,   2.50, 'Common parts',    2),
      (25,  75,   2.00, 'Mid-range',       3),
      (75,  200,  1.70, 'Major components',4),
      (200, null, 1.50, 'High-cost',       5);
  end if;
end $$;
