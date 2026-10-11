-- =========================================================
-- 009 — Admin access policies
-- Grants admins read access to every farmer-owned table,
-- update on pest_reports, and read on both storage buckets
-- (pest-reports + profile-avatars).
-- Requires 008 to have run first.
-- Safe to re-run.
-- =========================================================

-- ---------------------------------------------------------
-- 1. is_admin() helper
-- ---------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farmers
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------
-- 2. Read policies — farmer-owned tables
-- ---------------------------------------------------------

-- farmers
drop policy if exists "Admins read all farmers" on public.farmers;
create policy "Admins read all farmers"
  on public.farmers
  for select
  to authenticated
  using (public.is_admin());

-- farms
drop policy if exists "Admins read all farms" on public.farms;
create policy "Admins read all farms"
  on public.farms
  for select
  to authenticated
  using (public.is_admin());

-- tasks
drop policy if exists "Admins read all tasks" on public.tasks;
create policy "Admins read all tasks"
  on public.tasks
  for select
  to authenticated
  using (public.is_admin());

-- farm_expenses
drop policy if exists "Admins read all farm_expenses" on public.farm_expenses;
create policy "Admins read all farm_expenses"
  on public.farm_expenses
  for select
  to authenticated
  using (public.is_admin());

-- pest_reports (read + update)
drop policy if exists "Admins read all pest reports" on public.pest_reports;
create policy "Admins read all pest reports"
  on public.pest_reports
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update pest reports" on public.pest_reports;
create policy "Admins update pest reports"
  on public.pest_reports
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------
-- 3. Storage — admins read images from both buckets
-- ---------------------------------------------------------

-- Pest-report photos
drop policy if exists "Admins read all pest images" on storage.objects;
create policy "Admins read all pest images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'pest-reports'
    and public.is_admin()
  );

-- Farmer profile avatars
drop policy if exists "Admins read all profile avatars" on storage.objects;
create policy "Admins read all profile avatars"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and public.is_admin()
  );

-- ---------------------------------------------------------
-- 4. Verify
-- ---------------------------------------------------------
select polname, polrelid::regclass as table_name
from pg_policy
where (
    polrelid in (
      'public.farmers'::regclass,
      'public.farms'::regclass,
      'public.tasks'::regclass,
      'public.farm_expenses'::regclass,
      'public.pest_reports'::regclass
    )
    and polname like 'Admins %'
  )
  or (
    polrelid = 'storage.objects'::regclass
    and polname like 'Admins read%'
  )
order by polrelid, polname;