-- Generated artifact metadata and private Storage bucket.
-- Object key convention: "{auth.uid()}/{project_id}/{artifact_id}/{filename}".
-- First folder MUST equal user uuid for Storage RLS.
-- Runs after human.projects exists; safe to re-run.

create schema if not exists human;

-- ---------------------------------------------------------------------------
-- artifacts
-- ---------------------------------------------------------------------------
create table if not exists human.artifacts (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references human.projects (id) on delete cascade,
  owner_user_id   uuid not null references auth.users (id) on delete cascade,
  kind            text not null,
  status          text not null default 'ready',
  title           text,
  bucket_id       text not null,
  object_path     text not null,
  mime_type       text not null,
  byte_size       bigint not null default 0,
  metadata        jsonb not null default '{}'::jsonb,
  source_pin_ids  uuid[] not null default '{}'::uuid[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint human_artifacts_kind_nonempty check (length(trim(kind)) > 0),
  constraint human_artifacts_kind_max_len check (char_length(kind) <= 128),
  constraint human_artifacts_status_allowed check (status in ('pending', 'ready', 'failed')),
  constraint human_artifacts_bucket_nonempty check (length(trim(bucket_id)) > 0),
  constraint human_artifacts_object_path_nonempty check (length(trim(object_path)) > 0),
  constraint human_artifacts_mime_type_nonempty check (length(trim(mime_type)) > 0),
  constraint human_artifacts_byte_size_nonnegative check (byte_size >= 0),
  constraint human_artifacts_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table human.artifacts is 'Generated user artifacts; binary files live in Supabase Storage and this table stores metadata/pointers.';
comment on column human.artifacts.project_id is 'Owning human project; cascade delete removes artifact metadata.';
comment on column human.artifacts.owner_user_id is 'Auth user who owns this artifact and the Storage object prefix.';
comment on column human.artifacts.kind is 'Open artifact kind registry, e.g. podcast.';
comment on column human.artifacts.status is 'Artifact lifecycle status: pending, ready, or failed.';
comment on column human.artifacts.bucket_id is 'Supabase Storage bucket containing the object.';
comment on column human.artifacts.object_path is 'Path inside the Storage bucket; first folder segment must be owner_user_id.';
comment on column human.artifacts.metadata is 'Provider and UI metadata for generated artifacts; binary data is not stored here.';
comment on column human.artifacts.source_pin_ids is 'Optional source pins used to generate the artifact.';

create index if not exists human_artifacts_project_id_idx on human.artifacts (project_id);
create index if not exists human_artifacts_owner_user_id_idx on human.artifacts (owner_user_id);
create index if not exists human_artifacts_kind_idx on human.artifacts (kind);
create unique index if not exists human_artifacts_bucket_object_path_idx on human.artifacts (bucket_id, object_path);

create or replace function human.set_artifacts_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_artifacts_updated_at on human.artifacts;
create trigger trg_artifacts_updated_at
before update on human.artifacts
for each row
execute function human.set_artifacts_updated_at();

-- ---------------------------------------------------------------------------
-- RLS artifacts
-- ---------------------------------------------------------------------------
alter table human.artifacts enable row level security;

drop policy if exists "Users can select own artifacts" on human.artifacts;
create policy "Users can select own artifacts"
on human.artifacts
as permissive
for select
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from human.projects p
    where p.id = artifacts.project_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own artifacts" on human.artifacts;
create policy "Users can insert own artifacts"
on human.artifacts
as permissive
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from human.projects p
    where p.id = artifacts.project_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update own artifacts" on human.artifacts;
create policy "Users can update own artifacts"
on human.artifacts
as permissive
for update
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from human.projects p
    where p.id = artifacts.project_id
      and p.owner_user_id = auth.uid()
  )
)
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from human.projects p
    where p.id = artifacts.project_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own artifacts" on human.artifacts;
create policy "Users can delete own artifacts"
on human.artifacts
as permissive
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from human.projects p
    where p.id = artifacts.project_id
      and p.owner_user_id = auth.uid()
  )
);

grant select, insert, update, delete on table human.artifacts to authenticated;
revoke all on table human.artifacts from anon, public;

-- ---------------------------------------------------------------------------
-- Storage bucket and owner-prefix policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'human-artifacts',
  'human-artifacts',
  false,
  52428800,
  array['audio/mpeg', 'audio/mp3', 'application/zip']::text[]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Human artifacts select own prefix" on storage.objects;
create policy "Human artifacts select own prefix"
on storage.objects
as permissive
for select
to authenticated
using (
  bucket_id = 'human-artifacts'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Human artifacts insert own prefix" on storage.objects;
create policy "Human artifacts insert own prefix"
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'human-artifacts'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Human artifacts update own prefix" on storage.objects;
create policy "Human artifacts update own prefix"
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'human-artifacts'
  and (storage.foldername(name))[1] = (auth.uid())::text
)
with check (
  bucket_id = 'human-artifacts'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Human artifacts delete own prefix" on storage.objects;
create policy "Human artifacts delete own prefix"
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'human-artifacts'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- ---------------------------------------------------------------------------
-- Validation
-- ---------------------------------------------------------------------------
do $$
declare
  rls_artifacts boolean;
begin
  select relrowsecurity into rls_artifacts
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'human' and c.relname = 'artifacts';
  if not coalesce(rls_artifacts, false) then
    raise exception 'human.artifacts must have RLS enabled';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'artifacts'
      and policyname = 'Users can select own artifacts' and cmd = 'SELECT'
  ) then
    raise exception 'human.artifacts must have owner select policy';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'artifacts'
      and (roles @> array['anon']::name[] or roles @> array['public']::name[])
  ) then
    raise exception 'human.artifacts must not expose policies to anon or public';
  end if;

  if not exists (
    select 1 from storage.buckets
    where id = 'human-artifacts' and public is false
  ) then
    raise exception 'human-artifacts bucket must exist and be private';
  end if;
end
$$;
