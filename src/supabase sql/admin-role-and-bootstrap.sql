-- =========================================================
-- 008 — Admin role + bootstrap
-- Ensures the farmers.role column is valid and the
-- madaadmin@gmail.com account has an admin row.
-- Safe to re-run.
-- =========================================================

-- ---------------------------------------------------------
-- 1. role column
-- ---------------------------------------------------------
alter table public.farmers
  add column if not exists role text;

-- Backfill anything missing (existing installs where the column
-- was added without a default)
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
  'Odiongan, Romblon',
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