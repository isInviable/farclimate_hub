-- Public pinboard share links. Runs after 06_human_pinboards_pins.sql.
-- Idempotent: safe to re-run on environments that already have human.projects.

create schema if not exists human;

-- ---------------------------------------------------------------------------
-- project_share_links
-- ---------------------------------------------------------------------------
create table if not exists human.project_share_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references human.projects (id) on delete cascade,
  token       text not null,
  enabled     boolean not null default true,
  created_by  uuid not null references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  constraint human_project_share_links_token_unique unique (token),
  constraint human_project_share_links_token_nonempty check (length(trim(token)) > 0),
  constraint human_project_share_links_token_not_project_id check (token <> project_id::text)
);

comment on table human.project_share_links is 'Server-managed public pinboard share links; tokens resolve to project pinboards for read-only public board views.';
comment on column human.project_share_links.project_id is 'Project whose pinboard is shared; cascade delete removes share links.';
comment on column human.project_share_links.token is 'Opaque URL-safe public token; not the project UUID.';
comment on column human.project_share_links.enabled is 'Whether this token currently authorizes public board reads.';
comment on column human.project_share_links.created_by is 'Auth user who created the share link.';
comment on column human.project_share_links.revoked_at is 'Timestamp when the token was revoked, if applicable.';

create index if not exists human_project_share_links_project_id_idx
  on human.project_share_links (project_id);

create unique index if not exists human_project_share_links_one_enabled_per_project_idx
  on human.project_share_links (project_id)
  where enabled and revoked_at is null;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function human.set_project_share_links_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_project_share_links_updated_at on human.project_share_links;
create trigger trg_project_share_links_updated_at
before update on human.project_share_links
for each row
execute function human.set_project_share_links_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table human.project_share_links enable row level security;

-- No browser role receives direct table access. Share-link management and public
-- token resolution are mediated by server routes using fixed, narrow queries.
revoke all on table human.project_share_links from anon, authenticated, public;
grant select, insert, update, delete on table human.project_share_links to service_role;

-- Public board server routes also read project/pinboard/pin rows via service_role.
-- See 06_human_public_board_service_grants.sql for SELECT grants on those tables.

-- ---------------------------------------------------------------------------
-- Validation
-- ---------------------------------------------------------------------------
do $$
declare
  rls_share_links boolean;
begin
  select relrowsecurity into rls_share_links
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'human' and c.relname = 'project_share_links';
  if not coalesce(rls_share_links, false) then
    raise exception 'human.project_share_links must have RLS enabled';
  end if;

  if exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'human'
      and table_name = 'project_share_links'
      and lower(grantee) in ('anon', 'authenticated', 'public')
  ) then
    raise exception 'human.project_share_links must not grant browser roles direct table access';
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'human'
      and tablename = 'project_share_links'
      and indexname = 'human_project_share_links_one_enabled_per_project_idx'
  ) then
    raise exception 'human.project_share_links must enforce one enabled share per project';
  end if;
end
$$;
