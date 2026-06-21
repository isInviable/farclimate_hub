-- Default project on signup + last-project delete guard.
-- Idempotent: safe to re-run on environments that already applied earlier bootstrap steps.
-- No backfill for existing users without projects.

create or replace function human.bootstrap_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into human.profiles (id, display_name, avatar_url, preferences)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url',
    '{}'::jsonb
  )
  on conflict (id) do nothing;

  if not exists (
    select 1 from human.projects where owner_user_id = new.id
  ) then
    insert into human.projects (owner_user_id, name)
    values (new.id, 'Default project');
  end if;

  return new;
end;
$$;

comment on function human.bootstrap_profile_from_auth_user() is 'Creates a human.profiles row and default project for each new auth.users record.';

create or replace function human.prevent_delete_last_project()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  remaining integer;
begin
  select count(*) into remaining
  from human.projects
  where owner_user_id = old.owner_user_id
    and id <> old.id;

  if remaining = 0 then
    raise exception using
      errcode = 'P0001',
      message = 'HUMAN_LAST_PROJECT: Cannot delete your last project';
  end if;

  return old;
end;
$$;

comment on function human.prevent_delete_last_project() is 'Rejects project delete when it would leave the owner with zero projects.';

drop trigger if exists trg_prevent_delete_last_project on human.projects;
create trigger trg_prevent_delete_last_project
before delete on human.projects
for each row
execute function human.prevent_delete_last_project();
