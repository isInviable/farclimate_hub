-- Expose the human schema to PostgREST so the Supabase REST API accepts
-- requests for human.projects and human.profiles (fixes 406 Not Acceptable).
-- RLS still enforces who can see what; this only allows the API to route to the schema.
--
-- Client usage (supabase-js and REST): target the schema explicitly, e.g.
--   client.schema('human').from('projects')
-- Do NOT use .from('human.projects'): PostgREST resolves that as table name
-- "human.projects" inside schema "public", which yields PGRST205 / schema cache errors.

grant usage on schema human to anon, service_role;

alter role authenticator set pgrst.db_schemas = 'public, human';
