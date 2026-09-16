-- Connected Action CORDIS catalogue (public schema).
-- Idempotent: CREATE TABLE IF NOT EXISTS only. Never DROP.
--
-- This file must stay a faithful description of the hosted database, because it
-- is what `pnpm cordis:drift` compares against. Anything changed by hand in the
-- Supabase console belongs here too. Run `pnpm cordis:drift` after any manual
-- edit; a LIVE_IS_BETTER finding means this file is out of date.
--
-- Not run against the hosted project: the tables already exist, so
-- `cordis:create` is only for bootstrapping a fresh database. See 02_rls.sql.

create table if not exists public.aux_climate_risks (
  id integer primary key,
  name text not null
);

create table if not exists public.aux_themes (
  id integer primary key,
  name text not null
);

create table if not exists public.aux_entity_types (
  id serial primary key,
  name text unique not null
);

create table if not exists public.aux_product_categories (
  id integer primary key,
  name text not null
);

create table if not exists public.projects_cordis (
  id uuid primary key default gen_random_uuid(),
  cordis_id text not null unique,
  acronym text,
  teaser text,
  title text,
  keywords text,
  total_cost double precision,
  ec_max_contribution double precision,
  start_date text,
  end_date text,
  duration integer
);

create table if not exists public.entities_cordis (
  id uuid primary key default gen_random_uuid(),
  cordis_id text not null unique,
  vat_number text,
  legal_name text,
  short_name text,
  address_street text,
  address_city text,
  address_postal_code text,
  address_country text,
  address_url text,
  address_geolocation text,
  organization_activity_type_id integer not null references public.aux_entity_types (id) on delete restrict,
  related_region_name text,
  related_region_nuts_code text,
  related_region_iso_code text,
  related_nuts_code_nuts_code text
);

create table if not exists public.project_entities (
  project_id uuid not null references public.projects_cordis (id) on delete cascade,
  entity_id uuid not null references public.entities_cordis (id) on delete cascade,
  type text not null,
  entity_order integer not null,
  total_cost double precision,
  ec_contribution double precision,
  net_ec_contribution double precision,
  sme integer,
  terminated integer,
  primary key (project_id, entity_id)
);

create table if not exists public.project_risks (
  project_id uuid not null references public.projects_cordis (id) on delete cascade,
  risk_id integer not null references public.aux_climate_risks (id) on delete cascade,
  primary key (project_id, risk_id)
);

create table if not exists public.project_themes (
  project_id uuid not null references public.projects_cordis (id) on delete cascade,
  theme_id integer not null references public.aux_themes (id) on delete cascade,
  primary key (project_id, theme_id)
);

-- cordis_id is nullable so hand-authored products (products_custom) can live in
-- the same table; `type` distinguishes 'cordis' from custom rows.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  cordis_id text unique,
  type text not null,
  product_category_id integer not null references public.aux_product_categories (id) on delete restrict
);

create table if not exists public.products_cordis (
  product_id uuid primary key references public.products (id) on delete cascade,
  cordis_id text unique,
  title text,
  details_authors text,
  details_journal_number text,
  details_journal_title text,
  details_published_pages text,
  details_published_year text,
  details_publisher text,
  type_code text,
  type_title text,
  product_type_id integer,
  product_type_name text,
  sub_type_code text,
  sub_type_title text,
  doi text,
  issn text
);

create table if not exists public.products_custom (
  product_id uuid primary key references public.products (id) on delete cascade,
  title text,
  description text,
  "URL" text,
  image text[]
);

create table if not exists public.product_projects (
  product_id uuid not null references public.products (id) on delete cascade,
  project_id uuid not null references public.projects_cordis (id) on delete cascade,
  role text,
  primary key (product_id, project_id)
);

comment on column public.products_custom.image is 'url for the images';

-- Composite primary keys index their leading column only, so the reverse-side
-- lookups (a risk's projects, an entity's projects) and the loader's per-project
-- deletes would otherwise scan the whole table.
create index if not exists project_entities_entity_id_idx on public.project_entities (entity_id);
create index if not exists project_risks_risk_id_idx on public.project_risks (risk_id);
create index if not exists project_themes_theme_id_idx on public.project_themes (theme_id);
create index if not exists product_projects_project_id_idx on public.product_projects (project_id);
create index if not exists products_product_category_id_idx on public.products (product_category_id);
create index if not exists entities_cordis_activity_type_idx
  on public.entities_cordis (organization_activity_type_id);
