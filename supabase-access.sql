-- Strategy Board — client access
-- Run AFTER supabase-setup.sql and supabase-keywords.sql.
-- Paste into the Supabase SQL Editor and press Run. Safe to run twice.
--
-- Model: whoever creates a board owns it and is its admin. Anyone whose email
-- appears in board_access for that board can READ it and nothing else.

create table if not exists public.board_access (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.reports (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists board_access_unique_idx
  on public.board_access (board_id, lower(email));

-- ---------------------------------------------------------------
-- One helper decides every read. SECURITY DEFINER so it can look at
-- reports/board_access without tripping their own RLS, which would
-- otherwise recurse.
-- ---------------------------------------------------------------
create or replace function public.can_view_board(b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.reports r
    where r.id = b and r.owner_id = auth.uid()
  ) or exists (
    select 1 from public.board_access a
    where a.board_id = b
      and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.can_view_board(uuid) from public;
grant execute on function public.can_view_board(uuid) to authenticated;

-- ---------------------------------------------------------------
-- board_access itself: owners manage it, viewers may see their own row
-- ---------------------------------------------------------------
alter table public.board_access enable row level security;

drop policy if exists "owner manages access" on public.board_access;
drop policy if exists "viewer sees own access" on public.board_access;

create policy "owner manages access" on public.board_access
  for all
  using (exists (select 1 from public.reports r
                 where r.id = board_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.reports r
                      where r.id = board_id and r.owner_id = auth.uid()));

create policy "viewer sees own access" on public.board_access
  for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------------------------------------------------------------
-- reports: viewers read, only the owner writes
-- ---------------------------------------------------------------
drop policy if exists "read own reports"   on public.reports;
drop policy if exists "insert own reports" on public.reports;
drop policy if exists "update own reports" on public.reports;
drop policy if exists "delete own reports" on public.reports;

create policy "read own reports" on public.reports
  for select using (auth.uid() = owner_id or public.can_view_board(id));

create policy "insert own reports" on public.reports
  for insert with check (auth.uid() = owner_id);

create policy "update own reports" on public.reports
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "delete own reports" on public.reports
  for delete using (auth.uid() = owner_id);

-- ---------------------------------------------------------------
-- keywords: same shape
-- ---------------------------------------------------------------
drop policy if exists "read own keywords"   on public.keywords;
drop policy if exists "insert own keywords" on public.keywords;
drop policy if exists "update own keywords" on public.keywords;
drop policy if exists "delete own keywords" on public.keywords;

create policy "read own keywords" on public.keywords
  for select using (auth.uid() = owner_id or public.can_view_board(board_id));

create policy "insert own keywords" on public.keywords
  for insert with check (auth.uid() = owner_id);

create policy "update own keywords" on public.keywords
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "delete own keywords" on public.keywords
  for delete using (auth.uid() = owner_id);

-- ---------------------------------------------------------------
-- documents: files sit at <owner-id>/<board-id>/<filename>, so the
-- second path segment names the board a viewer may read.
-- ---------------------------------------------------------------
drop policy if exists "view shared documents" on storage.objects;

create policy "view shared documents" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and public.can_view_board(((storage.foldername(name))[2])::uuid)
  );
