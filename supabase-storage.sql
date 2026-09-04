-- Strategy Board — document storage setup
-- Paste this whole file into the Supabase SQL Editor and press Run.
-- Safe to run more than once.

-- ---------------------------------------------------------------
-- A private bucket. 25 MB per file.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 26214400)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- Let signed-in users see that this bucket exists, so the app can tell
-- "not set up yet" apart from "set up but empty".
drop policy if exists "read documents bucket" on storage.buckets;
create policy "read documents bucket" on storage.buckets
  for select using (id = 'documents');

-- ---------------------------------------------------------------
-- Files are stored at  <user-id>/<board-id>/<filename>,
-- so the first folder in the path decides who owns them.
-- These policies are what stop one account reading another's files.
-- ---------------------------------------------------------------
drop policy if exists "own documents read"   on storage.objects;
drop policy if exists "own documents insert" on storage.objects;
drop policy if exists "own documents update" on storage.objects;
drop policy if exists "own documents delete" on storage.objects;

create policy "own documents read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own documents insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own documents update" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own documents delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
