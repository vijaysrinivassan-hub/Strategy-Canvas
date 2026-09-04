-- Strategy Board — keyword repo
-- Paste into the Supabase SQL Editor and press Run. Safe to run twice.
--
-- One row per keyword per board. `selected` is the only thing the two
-- tables in the UI disagree about: false lives in the repo, true lives in
-- the selected table.

create table if not exists public.keywords (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users (id) on delete cascade,
  board_id          uuid not null references public.reports (id) on delete cascade,

  keyword           text not null,
  selected          boolean not null default false,

  -- the usual Ahrefs columns
  volume            integer,
  kd                numeric,
  cpc               numeric,
  traffic_potential integer,
  parent_topic      text,
  intent            text,
  country           text default 'us',

  -- where this row came from, and anything else the exporter sends
  source            text,
  data              jsonb not null default '{}'::jsonb,

  imported_at       timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Re-importing the same export should update rows, not duplicate them.
-- Use: insert ... on conflict (board_id, lower(keyword), country) do update ...
create unique index if not exists keywords_board_keyword_idx
  on public.keywords (board_id, lower(keyword), coalesce(country, ''));

create index if not exists keywords_board_selected_idx
  on public.keywords (board_id, selected, volume desc nulls last);

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table public.keywords enable row level security;

drop policy if exists "read own keywords"   on public.keywords;
drop policy if exists "insert own keywords" on public.keywords;
drop policy if exists "update own keywords" on public.keywords;
drop policy if exists "delete own keywords" on public.keywords;

create policy "read own keywords" on public.keywords
  for select using (auth.uid() = owner_id);

create policy "insert own keywords" on public.keywords
  for insert with check (auth.uid() = owner_id);

create policy "update own keywords" on public.keywords
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "delete own keywords" on public.keywords
  for delete using (auth.uid() = owner_id);

-- ---------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists keywords_touch_updated_at on public.keywords;
create trigger keywords_touch_updated_at
  before update on public.keywords
  for each row execute function public.touch_updated_at();
