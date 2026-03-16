-- Expose the human schema to PostgREST so the Supabase REST API accepts
-- requests for human.projects and human.profiles (fixes 406 Not Acceptable).
-- RLS still enforces who can see what; this only allows the API to route to the schema.

grant usage on schema human to anon, service_role;

alter role authenticator set pgrst.db_schemas = 'public, human';
