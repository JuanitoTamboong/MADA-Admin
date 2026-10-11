-- 1. Add the missing columns
alter table public.farmers
  add column if not exists status text not null default 'active',
  add column if not exists avatar_path text;

-- 2. Constrain status to known values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'farmers_status_check'
  ) then
    alter table public.farmers
      add constraint farmers_status_check
      check (status in ('active', 'inactive'));
  end if;
end $$;