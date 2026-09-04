-- Strategy Canvas — database setup
-- Paste this whole file into the Supabase SQL Editor and press Run.
-- Safe to run more than once.

-- ---------------------------------------------------------------
-- The reports table
-- ---------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Untitled report',
  body        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Fast "my reports, newest first" lookups.
create index if not exists reports_owner_updated_idx
  on public.reports (owner_id, updated_at desc);

-- ---------------------------------------------------------------
-- Row Level Security — this is what actually protects the data.
-- Without it, the publishable key would let anyone read every row.
-- ---------------------------------------------------------------
alter table public.reports enable row level security;

drop policy if exists "read own reports"   on public.reports;
drop policy if exists "insert own reports" on public.reports;
drop policy if exists "update own reports" on public.reports;
drop policy if exists "delete own reports" on public.reports;

create policy "read own reports" on public.reports
  for select using (auth.uid() = owner_id);

create policy "insert own reports" on public.reports
  for insert with check (auth.uid() = owner_id);

create policy "update own reports" on public.reports
  for update using (auth.uid() = owner_id)
          with check (auth.uid() = owner_id);

create policy "delete own reports" on public.reports
  for delete using (auth.uid() = owner_id);

-- ---------------------------------------------------------------
-- Keep updated_at honest without trusting the client to set it
-- ---------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_touch_updated_at on public.reports;

create trigger reports_touch_updated_at
  before update on public.reports
  for each row execute function public.touch_updated_at();
