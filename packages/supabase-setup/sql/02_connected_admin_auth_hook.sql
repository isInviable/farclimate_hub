create or replace function public.is_connected_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and role = 'connected_admin'::public.app_role
  );
$$;

comment on function public.is_connected_admin(uuid) is 'Returns true when the supplied auth user has the connected_admin application role.';

revoke all on function public.is_connected_admin(uuid) from authenticated, anon, public;
grant execute on function public.is_connected_admin(uuid) to supabase_auth_admin;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event->'claims', '{}'::jsonb);
  user_role public.app_role;
  app_metadata jsonb := coalesce(claims->'app_metadata', '{}'::jsonb);
begin
  select role
  into user_role
  from public.user_roles
  where user_id = (event->>'user_id')::uuid
  order by granted_at desc, id desc
  limit 1;

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role), true);
  else
    claims := claims - 'user_role';
  end if;

  app_metadata := app_metadata - 'user_role' - 'connected_admin';

  if user_role = 'connected_admin'::public.app_role then
    app_metadata := jsonb_set(app_metadata, '{user_role}', to_jsonb(user_role), true);
    app_metadata := jsonb_set(app_metadata, '{connected_admin}', 'true'::jsonb, true);
  end if;

  claims := jsonb_set(claims, '{app_metadata}', app_metadata, true);

  return jsonb_build_object('claims', claims);
end;
$$;

comment on function public.custom_access_token_hook(jsonb) is 'Injects the connected_admin custom claim for elevated users while leaving baseline authenticated users claim-free.';

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

create or replace function public.assign_connected_admin(target_user_id uuid, granted_by_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role, granted_by)
  values (target_user_id, 'connected_admin'::public.app_role, granted_by_user_id)
  on conflict (user_id, role)
  do update
    set granted_at = now(),
        granted_by = excluded.granted_by;
end;
$$;

comment on function public.assign_connected_admin(uuid, uuid) is 'Assigns or refreshes connected_admin for a user. Intended for the initial editor cohort management flow.';

create or replace function public.revoke_connected_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_roles
  where user_id = target_user_id
    and role = 'connected_admin'::public.app_role;
end;
$$;

comment on function public.revoke_connected_admin(uuid) is 'Revokes connected_admin from a user.';

revoke all on function public.assign_connected_admin(uuid, uuid) from authenticated, anon, public;
revoke all on function public.revoke_connected_admin(uuid) from authenticated, anon, public;
grant execute on function public.assign_connected_admin(uuid, uuid) to service_role;
grant execute on function public.revoke_connected_admin(uuid) to service_role;
