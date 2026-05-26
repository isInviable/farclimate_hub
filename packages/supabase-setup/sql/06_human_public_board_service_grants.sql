-- Read-only grants for server-mediated public pinboard routes.
-- service_role bypasses RLS but still needs table-level privileges on custom-schema tables.
-- Runs after 06_human_project_share_links.sql.

grant select on table human.projects to service_role;
grant select on table human.pinboards to service_role;
grant select on table human.pins to service_role;

do $$
begin
  if not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'human'
      and table_name = 'projects'
      and grantee = 'service_role'
      and privilege_type = 'SELECT'
  ) then
    raise exception 'human.projects must grant SELECT to service_role for public board reads';
  end if;

  if not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'human'
      and table_name = 'pinboards'
      and grantee = 'service_role'
      and privilege_type = 'SELECT'
  ) then
    raise exception 'human.pinboards must grant SELECT to service_role for public board reads';
  end if;

  if not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'human'
      and table_name = 'pins'
      and grantee = 'service_role'
      and privilege_type = 'SELECT'
  ) then
    raise exception 'human.pins must grant SELECT to service_role for public board reads';
  end if;
end
$$;
