-- Pinboards (1:1 with projects) and pins. Runs after 04_human_projects.sql.
-- Idempotent: safe to re-run on environments that already have human.projects.

create schema if not exists human;

-- ---------------------------------------------------------------------------
-- pinboards
-- ---------------------------------------------------------------------------
create table if not exists human.pinboards (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references human.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id)
);

comment on table human.pinboards is 'One curated workspace per project; created automatically when a project is inserted.';
comment on column human.pinboards.project_id is 'Owning project; cascade delete removes pinboard and pins.';
comment on column human.pinboards.created_at is 'Pinboard creation timestamp.';
comment on column human.pinboards.updated_at is 'Pinboard last-update timestamp.';

create index if not exists human_pinboards_project_id_idx on human.pinboards (project_id);

-- ---------------------------------------------------------------------------
-- pins
-- ---------------------------------------------------------------------------
create table if not exists human.pins (
  id                     uuid primary key default gen_random_uuid(),
  pinboard_id            uuid not null references human.pinboards (id) on delete cascade,
  source_document_uid    text,
  source_title_snapshot  text,
  body_kind              text not null,
  body                   jsonb not null,
  user_note              text,
  sort_order             integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint human_pins_body_envelope_v1 check (
    (body ? 'v')
    and (body ? 'data')
    and jsonb_typeof(body -> 'data') = 'object'
    and ((body ->> 'v')::integer = 1)
  ),
  constraint human_pins_body_kind_nonempty check (length(trim(body_kind)) > 0),
  constraint human_pins_body_kind_max_len check (char_length(body_kind) <= 128),
  constraint human_pins_body_max_octets check (octet_length(body::text) <= 524288)
);

comment on table human.pins is 'User-curated items on a pinboard; logical doc refs only (no FK to knowledge).';
comment on column human.pins.source_document_uid is 'Stable logical document id when pinned from knowledge; optional.';
comment on column human.pins.source_title_snapshot is 'Title at pin time for manual recovery; optional.';
comment on column human.pins.body_kind is 'Open registry string; shape validated in application code.';
comment on column human.pins.body is 'JSON envelope: {"v":1,"data":{...}}; v must be 1 for this beta.';
comment on column human.pins.user_note is 'Optional user-authored note on this pin.';
comment on column human.pins.sort_order is 'Display order within the pinboard.';

create index if not exists human_pins_pinboard_id_idx on human.pins (pinboard_id);
create index if not exists human_pins_body_kind_idx on human.pins (body_kind);
create index if not exists human_pins_source_document_uid_idx on human.pins (source_document_uid)
  where source_document_uid is not null;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function human.set_pinboards_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function human.set_pins_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_pinboards_updated_at on human.pinboards;
create trigger trg_pinboards_updated_at
before update on human.pinboards
for each row
execute function human.set_pinboards_updated_at();

drop trigger if exists trg_pins_updated_at on human.pins;
create trigger trg_pins_updated_at
before update on human.pins
for each row
execute function human.set_pins_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create pinboard when a project is created
-- ---------------------------------------------------------------------------
create or replace function human.ensure_pinboard_for_project()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into human.pinboards (project_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists trg_projects_create_pinboard on human.projects;
create trigger trg_projects_create_pinboard
after insert on human.projects
for each row
execute function human.ensure_pinboard_for_project();

-- One-time backfill: projects created before this migration had no pinboard
insert into human.pinboards (project_id)
select p.id
from human.projects p
where not exists (select 1 from human.pinboards b where b.project_id = p.id);

-- ---------------------------------------------------------------------------
-- RLS pinboards
-- ---------------------------------------------------------------------------
alter table human.pinboards enable row level security;

drop policy if exists "Users can select own pinboards" on human.pinboards;
create policy "Users can select own pinboards"
on human.pinboards
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from human.projects p
    where p.id = pinboards.project_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own pinboards" on human.pinboards;
create policy "Users can insert own pinboards"
on human.pinboards
as permissive
for insert
to authenticated
with check (
  exists (
    select 1
    from human.projects p
    where p.id = pinboards.project_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update own pinboards" on human.pinboards;
create policy "Users can update own pinboards"
on human.pinboards
as permissive
for update
to authenticated
using (
  exists (
    select 1
    from human.projects p
    where p.id = pinboards.project_id
      and p.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from human.projects p
    where p.id = pinboards.project_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own pinboards" on human.pinboards;
create policy "Users can delete own pinboards"
on human.pinboards
as permissive
for delete
to authenticated
using (
  exists (
    select 1
    from human.projects p
    where p.id = pinboards.project_id
      and p.owner_user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- RLS pins
-- ---------------------------------------------------------------------------
alter table human.pins enable row level security;

drop policy if exists "Users can select own pins" on human.pins;
create policy "Users can select own pins"
on human.pins
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from human.pinboards b
    join human.projects p on p.id = b.project_id
    where b.id = pins.pinboard_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own pins" on human.pins;
create policy "Users can insert own pins"
on human.pins
as permissive
for insert
to authenticated
with check (
  exists (
    select 1
    from human.pinboards b
    join human.projects p on p.id = b.project_id
    where b.id = pins.pinboard_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update own pins" on human.pins;
create policy "Users can update own pins"
on human.pins
as permissive
for update
to authenticated
using (
  exists (
    select 1
    from human.pinboards b
    join human.projects p on p.id = b.project_id
    where b.id = pins.pinboard_id
      and p.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from human.pinboards b
    join human.projects p on p.id = b.project_id
    where b.id = pins.pinboard_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own pins" on human.pins;
create policy "Users can delete own pins"
on human.pins
as permissive
for delete
to authenticated
using (
  exists (
    select 1
    from human.pinboards b
    join human.projects p on p.id = b.project_id
    where b.id = pins.pinboard_id
      and p.owner_user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table human.pinboards to authenticated;
grant select, insert, update, delete on table human.pins to authenticated;
revoke all on table human.pinboards from anon, public;
revoke all on table human.pins from anon, public;

-- ---------------------------------------------------------------------------
-- Validation
-- ---------------------------------------------------------------------------
do $$
declare
  rls_pinboards boolean;
  rls_pins boolean;
begin
  select relrowsecurity into rls_pinboards
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'human' and c.relname = 'pinboards';
  if not coalesce(rls_pinboards, false) then
    raise exception 'human.pinboards must have RLS enabled';
  end if;

  select relrowsecurity into rls_pins
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'human' and c.relname = 'pins';
  if not coalesce(rls_pins, false) then
    raise exception 'human.pins must have RLS enabled';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'pins'
      and policyname = 'Users can select own pins' and cmd = 'SELECT'
  ) then
    raise exception 'human.pins must have owner select policy';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'pins'
      and (roles @> array['anon']::name[] or roles @> array['public']::name[])
  ) then
    raise exception 'human.pins must not expose policies to anon or public';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'human' and tablename = 'pinboards'
      and (roles @> array['anon']::name[] or roles @> array['public']::name[])
  ) then
    raise exception 'human.pinboards must not expose policies to anon or public';
  end if;
end
$$;
