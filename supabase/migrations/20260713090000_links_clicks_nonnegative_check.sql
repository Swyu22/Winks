-- Keep click counters inside the non-negative domain promised by the frontend contract.
-- Normalize any legacy bad rows before validating the constraint.
update public.links
set clicks = 0
where clicks < 0;

alter table public.links
  drop constraint if exists links_clicks_nonnegative_check;

alter table public.links
  add constraint links_clicks_nonnegative_check check (clicks >= 0);
