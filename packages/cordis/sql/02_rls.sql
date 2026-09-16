-- RLS for Connected Action CORDIS tables.
-- Public read (Hub visualisations). Writes require connected_admin JWT claim.
-- Pipeline loaders use DATABASE_URL and bypass RLS.
--
-- ============================================================================
-- DO NOT RUN THIS FILE AGAINST THE HOSTED PROJECT (and therefore do not run
-- `pnpm cordis:create`, which executes it).
--
-- The hosted database was secured by hand in the Supabase console, so its
-- policies do not line up with this file:
--
--   live                       this file
--   -------------------------  --------------------------------------
--   "Public read access"       "Public read access"          (aligned)
--   "Authenticated insert"     -- not dropped by this file --
--   "Authenticated update"     -- not dropped by this file --
--   "Authenticated delete"     -- not dropped by this file --
--   (none)                     "Connected admins can manage <table>"
--
-- The live write policies grant `auth.role() = 'authenticated'`, i.e. any
-- logged-in user can edit the whole catalogue. Nothing below drops them, and
-- because permissive policies are OR'd together, adding "Connected admins can
-- manage" alongside them would restrict nothing while looking like it did.
--
-- Tightening writes is therefore a separate change that must, in one
-- transaction, drop the three "Authenticated *" policies and create the
-- connected_admin ones. Confirm first that admin JWTs really carry the claim
-- (packages/supabase-setup/sql/02_connected_admin_auth_hook.sql), or the admin
-- screens lock themselves out.
--
-- `pnpm cordis:drift` reports this gap on every run so it stays visible.
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select on table
  public.aux_climate_risks,
  public.aux_themes,
  public.aux_entity_types,
  public.aux_product_categories,
  public.projects_cordis,
  public.entities_cordis,
  public.project_entities,
  public.project_risks,
  public.project_themes,
  public.products,
  public.products_cordis,
  public.products_custom,
  public.product_projects
to anon, authenticated;

grant insert, update, delete on table
  public.aux_climate_risks,
  public.aux_themes,
  public.aux_entity_types,
  public.aux_product_categories,
  public.projects_cordis,
  public.entities_cordis,
  public.project_entities,
  public.project_risks,
  public.project_themes,
  public.products,
  public.products_cordis,
  public.products_custom,
  public.product_projects
to authenticated;

grant usage, select on sequence public.aux_entity_types_id_seq to authenticated;

alter table public.aux_climate_risks enable row level security;
alter table public.aux_themes enable row level security;
alter table public.aux_entity_types enable row level security;
alter table public.aux_product_categories enable row level security;
alter table public.projects_cordis enable row level security;
alter table public.entities_cordis enable row level security;
alter table public.project_entities enable row level security;
alter table public.project_risks enable row level security;
alter table public.project_themes enable row level security;
alter table public.products enable row level security;
alter table public.products_cordis enable row level security;
alter table public.products_custom enable row level security;
alter table public.product_projects enable row level security;

-- SELECT for everyone
drop policy if exists "Public read access" on public.aux_climate_risks;
create policy "Public read access" on public.aux_climate_risks for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.aux_themes;
create policy "Public read access" on public.aux_themes for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.aux_entity_types;
create policy "Public read access" on public.aux_entity_types for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.aux_product_categories;
create policy "Public read access" on public.aux_product_categories for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.projects_cordis;
create policy "Public read access" on public.projects_cordis for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.entities_cordis;
create policy "Public read access" on public.entities_cordis for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.project_entities;
create policy "Public read access" on public.project_entities for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.project_risks;
create policy "Public read access" on public.project_risks for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.project_themes;
create policy "Public read access" on public.project_themes for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.products;
create policy "Public read access" on public.products for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.products_cordis;
create policy "Public read access" on public.products_cordis for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.products_custom;
create policy "Public read access" on public.products_custom for select to anon, authenticated using (true);
drop policy if exists "Public read access" on public.product_projects;
create policy "Public read access" on public.product_projects for select to anon, authenticated using (true);

-- Writes for connected_admin
drop policy if exists "Connected admins can manage aux_climate_risks" on public.aux_climate_risks;
create policy "Connected admins can manage aux_climate_risks" on public.aux_climate_risks for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage aux_themes" on public.aux_themes;
create policy "Connected admins can manage aux_themes" on public.aux_themes for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage aux_entity_types" on public.aux_entity_types;
create policy "Connected admins can manage aux_entity_types" on public.aux_entity_types for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage aux_product_categories" on public.aux_product_categories;
create policy "Connected admins can manage aux_product_categories" on public.aux_product_categories for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage projects_cordis" on public.projects_cordis;
create policy "Connected admins can manage projects_cordis" on public.projects_cordis for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage entities_cordis" on public.entities_cordis;
create policy "Connected admins can manage entities_cordis" on public.entities_cordis for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage project_entities" on public.project_entities;
create policy "Connected admins can manage project_entities" on public.project_entities for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage project_risks" on public.project_risks;
create policy "Connected admins can manage project_risks" on public.project_risks for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage project_themes" on public.project_themes;
create policy "Connected admins can manage project_themes" on public.project_themes for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage products" on public.products;
create policy "Connected admins can manage products" on public.products for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage products_cordis" on public.products_cordis;
create policy "Connected admins can manage products_cordis" on public.products_cordis for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage products_custom" on public.products_custom;
create policy "Connected admins can manage products_custom" on public.products_custom for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');

drop policy if exists "Connected admins can manage product_projects" on public.product_projects;
create policy "Connected admins can manage product_projects" on public.product_projects for all to authenticated
using ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true')
with check ((auth.jwt() ->> 'user_role') = 'connected_admin' or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true');
