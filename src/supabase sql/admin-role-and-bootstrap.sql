-- =========================================================
-- 008 — Admin role + bootstrap
-- Ensures:
--   • the farmers table exists with a valid `role` column
--   • the madaadmin@gmail.com account has an admin row
-- Safe to re-run on any project state.
-- =========================================================

-- ---------------------------------------------------------
-- 0. Ensure farmers table exists (in case 001 wasn't run)
-- ---------------------------------------------------------
create table if not exists public.farmers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (btrim(full_name) <> ''),
  email text not null,
  address text not null check (btrim(address) <> ''),
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 1. role column — safe order for both empty and populated tables
-- ---------------------------------------------------------
alter table public.farmers
  add column if not exists role text;

-- Backfill NULL and empty-string values, THEN enforce NOT NULL
update public.farmers
   set role = 'farmer'
 where role is null or btrim(role) = '';

alter table public.farmers
  alter column role set default 'farmer',
  alter column role set not null;

-- CHECK constraint (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'farmers_role_check'
  ) then
    alter table public.farmers
      add constraint farmers_role_check
      check (role in ('farmer', 'admin'));
  end if;
end $$;

-- ---------------------------------------------------------
-- 2. Admin row for madaadmin@gmail.com
-- ---------------------------------------------------------
insert into public.farmers (id, full_name, email, address, role)
select
  u.id,
  'MADA Admin',
  u.email,
  'Odiongan, Romlom',
  'admin'
from auth.users u
where u.email = 'madaadmin@gmail.com'
on conflict (id) do update
  set role      = 'admin',
      full_name = excluded.full_name,
      address   = excluded.address,
      email     = excluded.email;

-- ---------------------------------------------------------
-- 3. Verify
-- ---------------------------------------------------------
select
  (select count(*) from public.farmers where role = 'farmer') as total_farmers,
  (select count(*) from public.farmers where role = 'admin')  as total_admins;

select id, full_name, email, role
from public.farmers
order by role, created_at desc;