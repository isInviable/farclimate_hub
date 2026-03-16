-- human schema created by 03_human_profiles.sql; ensure it exists for standalone re-runs
create schema if not exists human;

create table if not exists human.projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table human.projects is 'Root workspace container for user-owned curation; direct ownership by auth user.';
comment on column human.projects.owner_user_id is 'Auth user who owns this project; must equal auth.uid() for RLS.';
comment on column human.projects.name is 'User-facing project name.';
comment on column human.projects.description is 'Optional project description.';
comment on column human.projects.created_at is 'Project creation timestamp.';
comment on column human.projects.updated_at is 'Project last-update timestamp.';

create index if not exists human_projects_owner_user_id_idx on human.projects (owner_user_id);

create or replace function human.set_projects_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated_at on human.projects;
create trigger trg_projects_updated_at
before update on human.projects
for each row
execute function human.set_projects_updated_at();

alter table human.projects enable row level security;

drop policy if exists "Users can insert own projects" on human.projects;
create policy "Users can insert own projects"
on human.projects
as permissive
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "Users can select own projects" on human.projects;
create policy "Users can select own projects"
on human.projects
as permissive
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "Users can update own projects" on human.projects;
create policy "Users can update own projects"
on human.projects
as permissive
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Users can delete own projects" on human.projects;
create policy "Users can delete own projects"
on human.projects
as permissive
for delete
to authenticated
using (owner_user_id = auth.uid());

grant usage on schema human to authenticated;
grant insert, select, update, delete on table human.projects to authenticated;
revoke all on table human.projects from anon, public;

-- Validation: RLS enabled and owner-only policies; no anon/public access
do $$
declare
  rls_ok boolean;
  insert_ok boolean;
  select_ok boolean;
  update_ok boolean;
  delete_ok boolean;
  anon_ok boolean;
begin
  select relrowsecurity into rls_ok
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'human' and c.relname = 'projects';
  if not coalesce(rls_ok, false) then
    raise exception 'human.projects must have RLS enabled';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'projects'
      and policyname = 'Users can insert own projects' and cmd = 'INSERT'
      and qual is null and with_check is not null
  ) then
    raise exception 'human.projects must have owner-only insert policy';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'projects'
      and policyname = 'Users can select own projects' and cmd = 'SELECT'
      and qual is not null
  ) then
    raise exception 'human.projects must have owner-only select policy';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'projects'
      and policyname = 'Users can update own projects' and cmd = 'UPDATE'
      and qual is not null and with_check is not null
  ) then
    raise exception 'human.projects must have owner-only update policy';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'projects'
      and policyname = 'Users can delete own projects' and cmd = 'DELETE'
      and qual is not null
  ) then
    raise exception 'human.projects must have owner-only delete policy';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'projects'
      and (roles @> array['anon']::name[] or roles @> array['public']::name[])
  ) then
    raise exception 'human.projects must not expose policies to anon or public';
  end if;
end
$$;
