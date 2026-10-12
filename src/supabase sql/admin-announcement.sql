-- ============================================================
-- 1. Announcements table (safe to re-run)
-- ============================================================

create table if not exists public.announcements (
  id text primary key,
  title text not null,
  category text not null check (
    category in (
      'Assistance',
      'Training',
      'Distribution Schedule',
      'Weather Advisory',
      'General'
    )
  ),
  audience text not null,
  location text not null default 'Municipal agriculture office',
  publish_date date not null default current_date,
  expiry_date date not null,
  status text not null default 'Draft' check (
    status in ('Draft', 'Published', 'Scheduled', 'Archived')
  ),
  summary text not null,
  instructions text not null default 'Review the notice and share the required guidance with the target audience.',
  contact text not null default 'Municipal agriculture office',
  image_url text,                                  -- ← cover image (nullable)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If the table already existed WITHOUT image_url, add it now
alter table public.announcements
  add column if not exists image_url text;

-- ============================================================
-- 2. Indexes (safe to re-run)
-- ============================================================

create index if not exists announcements_status_idx
  on public.announcements (status);

create index if not exists announcements_category_idx
  on public.announcements (category);

create index if not exists announcements_publish_idx
  on public.announcements (publish_date desc);

-- ============================================================
-- 3. Auto-update updated_at on every row change
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists announcements_set_updated_at on public.announcements;

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

-- ============================================================
-- 4. Storage bucket for announcement images (NEW)
-- ============================================================

-- Create the bucket if it doesn't exist (public = anyone can read the file URL)
insert into storage.buckets (id, name, public)
values ('announcement-images', 'announcement-images', true)
on conflict (id) do update set public = true;

-- ============================================================
-- 5. Storage policies (NEW)
-- ============================================================

-- Public read: anyone with the URL can view the image
drop policy if exists "Public can view announcement images" on storage.objects;
create policy "Public can view announcement images"
on storage.objects for select
to public
using (bucket_id = 'announcement-images');

-- Upload: authenticated users (or anon in dev — see note below)
drop policy if exists "Admins can upload announcement images" on storage.objects;
create policy "Admins can upload announcement images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'announcement-images');

-- Delete: authenticated users
drop policy if exists "Admins can delete announcement images" on storage.objects;
create policy "Admins can delete announcement images"
on storage.objects for delete
to authenticated
using (bucket_id = 'announcement-images');

-- Update (needed for Replace / upsert): authenticated users
drop policy if exists "Admins can update announcement images" on storage.objects;
create policy "Admins can update announcement images"
on storage.objects for update
to authenticated
using (bucket_id = 'announcement-images')
with check (bucket_id = 'announcement-images');