create schema if not exists human;

create table if not exists human.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table human.profiles is 'Durable human-domain profile mapped 1:1 to auth.users identity.';
comment on column human.profiles.id is 'Canonical identity, equal to auth.users.id.';
comment on column human.profiles.display_name is 'User-facing display name (optional).';
comment on column human.profiles.avatar_url is 'Avatar image URL (optional).';
comment on column human.profiles.preferences is 'Flexible user preference payload for product settings.';
comment on column human.profiles.created_at is 'Profile creation timestamp.';
comment on column human.profiles.updated_at is 'Profile last-update timestamp.';

create or replace function human.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on human.profiles;
create trigger trg_profiles_updated_at
before update on human.profiles
for each row
execute function human.set_profiles_updated_at();

alter table human.profiles enable row level security;

drop policy if exists "Users can select own profile" on human.profiles;
create policy "Users can select own profile"
on human.profiles
as permissive
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on human.profiles;
create policy "Users can update own profile"
on human.profiles
as permissive
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

grant usage on schema human to authenticated;
grant select, update on table human.profiles to authenticated;
revoke all on schema human from anon, public;
revoke all on table human.profiles from anon, public;

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

  return new;
end;
$$;

comment on function human.bootstrap_profile_from_auth_user() is 'Creates a human.profiles row for each new auth.users record.';

revoke all on function human.bootstrap_profile_from_auth_user() from authenticated, anon, public;
grant execute on function human.bootstrap_profile_from_auth_user() to service_role;

drop trigger if exists trg_bootstrap_human_profile on auth.users;
create trigger trg_bootstrap_human_profile
after insert on auth.users
for each row
execute function human.bootstrap_profile_from_auth_user();

do $$
declare
  select_qual text;
  update_qual text;
  update_check text;
begin
  -- Validate that profile table is protected by RLS.
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'human'
      and c.relname = 'profiles'
      and c.relrowsecurity
  ) then
    raise exception 'human.profiles must have RLS enabled';
  end if;

  -- Validate owner-only policy predicates for authenticated users.
  select qual
  into select_qual
  from pg_policies
  where schemaname = 'human'
    and tablename = 'profiles'
    and policyname = 'Users can select own profile'
    and cmd = 'SELECT';

  if select_qual is null
     or position('auth.uid()' in select_qual) = 0
     or position('id' in select_qual) = 0 then
    raise exception 'Select policy must enforce id = auth.uid() on human.profiles';
  end if;

  select qual, with_check
  into update_qual, update_check
  from pg_policies
  where schemaname = 'human'
    and tablename = 'profiles'
    and policyname = 'Users can update own profile'
    and cmd = 'UPDATE';

  if update_qual is null
     or update_check is null
     or position('auth.uid()' in update_qual) = 0
     or position('id' in update_qual) = 0
     or position('auth.uid()' in update_check) = 0
     or position('id' in update_check) = 0 then
    raise exception 'Update policy must enforce id = auth.uid() on human.profiles';
  end if;

  -- Validate there is no anon/public profile policy access.
  if exists (
    select 1
    from pg_policies
    where schemaname = 'human'
      and tablename = 'profiles'
      and (
        roles @> array['anon']::name[]
        or roles @> array['public']::name[]
      )
  ) then
    raise exception 'human.profiles must not expose policies to anon/public';
  end if;

  -- Validate no client-side insert/delete policies have been added.
  if exists (
    select 1
    from pg_policies
    where schemaname = 'human'
      and tablename = 'profiles'
      and cmd in ('INSERT', 'DELETE')
  ) then
    raise exception 'human.profiles should not define client insert/delete policies in bootstrap';
  end if;
end
$$;
