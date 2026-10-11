-- =========================================================
-- 011 — report_followups
-- Stores admin follow-up actions on pest_reports.
-- =========================================================
create table if not exists public.report_followups (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.pest_reports (id) on delete cascade,
  author text not null default 'admin',
  action text not null check (btrim(action) <> ''),
  created_at timestamptz not null default now()
);

create index if not exists report_followups_report_idx
  on public.report_followups (report_id, created_at asc);

alter table public.report_followups enable row level security;

-- Admins only
drop policy if exists "Admins read followups" on public.report_followups;
create policy "Admins read followups"
  on public.report_followups
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins insert followups" on public.report_followups;
create policy "Admins insert followups"
  on public.report_followups
  for insert
  to authenticated
  with check (public.is_admin());

grant select, insert on public.report_followups to authenticated;