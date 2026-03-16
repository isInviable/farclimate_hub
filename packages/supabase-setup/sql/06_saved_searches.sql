-- Depends on 04_human_projects.sql (human.projects table)
create schema if not exists human;

create table if not exists human.saved_searches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references human.projects (id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table human.saved_searches is 'Named search-state snapshots scoped to a project.';
comment on column human.saved_searches.project_id is 'Parent project; cascades on delete.';
comment on column human.saved_searches.name is 'User-given name for this saved search.';
comment on column human.saved_searches.filters is 'Serialised search state: { searchQuery, enabledFilters, filters }.';
comment on column human.saved_searches.created_at is 'Row creation timestamp.';
comment on column human.saved_searches.updated_at is 'Row last-update timestamp.';

create index if not exists human_saved_searches_project_id_idx
  on human.saved_searches (project_id);

-- updated_at trigger (same pattern as human.projects)
create or replace function human.set_saved_searches_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_saved_searches_updated_at on human.saved_searches;
create trigger trg_saved_searches_updated_at
before update on human.saved_searches
for each row
execute function human.set_saved_searches_updated_at();

-- RLS: owner-only via join to human.projects.owner_user_id
alter table human.saved_searches enable row level security;

drop policy if exists "Users can select own saved searches" on human.saved_searches;
create policy "Users can select own saved searches"
on human.saved_searches
as permissive
for select
to authenticated
using (
  exists (
    select 1 from human.projects p
    where p.id = project_id and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own saved searches" on human.saved_searches;
create policy "Users can insert own saved searches"
on human.saved_searches
as permissive
for insert
to authenticated
with check (
  exists (
    select 1 from human.projects p
    where p.id = project_id and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update own saved searches" on human.saved_searches;
create policy "Users can update own saved searches"
on human.saved_searches
as permissive
for update
to authenticated
using (
  exists (
    select 1 from human.projects p
    where p.id = project_id and p.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from human.projects p
    where p.id = project_id and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own saved searches" on human.saved_searches;
create policy "Users can delete own saved searches"
on human.saved_searches
as permissive
for delete
to authenticated
using (
  exists (
    select 1 from human.projects p
    where p.id = project_id and p.owner_user_id = auth.uid()
  )
);

grant usage on schema human to authenticated;
grant insert, select, update, delete on table human.saved_searches to authenticated;
revoke all on table human.saved_searches from anon, public;

-- Validation block
do $$
declare
  rls_ok boolean;
begin
  select relrowsecurity into rls_ok
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'human' and c.relname = 'saved_searches';
  if not coalesce(rls_ok, false) then
    raise exception 'human.saved_searches must have RLS enabled';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'saved_searches'
      and policyname = 'Users can insert own saved searches' and cmd = 'INSERT'
  ) then
    raise exception 'human.saved_searches must have owner-only insert policy';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'saved_searches'
      and policyname = 'Users can select own saved searches' and cmd = 'SELECT'
  ) then
    raise exception 'human.saved_searches must have owner-only select policy';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'saved_searches'
      and policyname = 'Users can update own saved searches' and cmd = 'UPDATE'
  ) then
    raise exception 'human.saved_searches must have owner-only update policy';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'saved_searches'
      and policyname = 'Users can delete own saved searches' and cmd = 'DELETE'
  ) then
    raise exception 'human.saved_searches must have owner-only delete policy';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'saved_searches'
      and (roles @> array['anon']::name[] or roles @> array['public']::name[])
  ) then
    raise exception 'human.saved_searches must not expose policies to anon or public';
  end if;
end
$$;
