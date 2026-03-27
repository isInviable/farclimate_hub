-- Pin image storage: private bucket + owner-scoped object paths.
-- Object key convention: "{auth.uid()}/{pin_id or arbitrary}/{filename}" — first folder MUST equal user uuid for RLS.
-- Beta limit: 20 MiB per object; MIME image/jpeg, image/png, image/webp, image/gif.
-- Requires Supabase (storage schema). Run after 06_human_pinboards_pins.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'human-pin-images',
  'human-pin-images',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies: first path segment = auth.uid()::text
drop policy if exists "Pin images select own prefix" on storage.objects;
create policy "Pin images select own prefix"
on storage.objects
as permissive
for select
to authenticated
using (
  bucket_id = 'human-pin-images'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Pin images insert own prefix" on storage.objects;
create policy "Pin images insert own prefix"
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'human-pin-images'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Pin images update own prefix" on storage.objects;
create policy "Pin images update own prefix"
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'human-pin-images'
  and (storage.foldername(name))[1] = (auth.uid())::text
)
with check (
  bucket_id = 'human-pin-images'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Pin images delete own prefix" on storage.objects;
create policy "Pin images delete own prefix"
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'human-pin-images'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
