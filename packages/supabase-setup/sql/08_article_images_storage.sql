-- Article image storage: public bucket for Climate-ADAPT (and future) article images.
-- Object key convention: "climateadapt/<slug>/NN.<ext>" (NN is 2-digit zero-padded position).
-- The TS loader (packages/db/src/push-climate-adapt.ts) writes with the service role.
-- The explorer frontend reads the public URL; no RLS on read is needed because the
-- original images are already publicly served by Climate-ADAPT.
-- Run after 07_human_pin_storage.sql (or independently).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
