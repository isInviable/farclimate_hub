-- Skills content editor: public Connected Action content managed by connected_admin users.
-- This file intentionally creates objects only in the public schema and storage metadata.
-- Do not add human.* or knowledge.* objects here.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'skill_status'
  ) then
    create type public.skill_status as enum ('draft', 'published');
  end if;
end
$$;

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  header_image_path text,
  status public.skill_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_slug_not_empty check (length(trim(slug)) > 0),
  constraint skills_published_at_when_published check (
    (status = 'published'::public.skill_status and published_at is not null)
    or (status = 'draft'::public.skill_status)
  )
);

comment on table public.skills is 'Shared skill records for Connected Action public skills content.';
comment on column public.skills.slug is 'Locale-independent public slug for skill detail routing.';
comment on column public.skills.header_image_path is 'Object path in the public skills Storage bucket.';
comment on column public.skills.status is 'Editorial status. Only published skills are visible publicly.';
comment on column public.skills.published_at is 'Timestamp used for public ordering and display metadata.';

create table if not exists public.skill_contents (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete cascade,
  locale text not null,
  title text not null,
  body_markdown text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skill_contents_locale_check check (locale in ('en', 'es', 'it')),
  constraint skill_contents_title_not_empty check (length(trim(title)) > 0),
  unique (skill_id, locale)
);

comment on table public.skill_contents is 'Localized skill content rows. Only title and markdown body are localized.';
comment on column public.skill_contents.locale is 'Locale code: en, es, or it.';
comment on column public.skill_contents.body_markdown is 'Markdown body. Content before <!-- more --> is used as the summary.';

create table if not exists public.skill_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_es text not null,
  name_it text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skill_tags_slug_not_empty check (length(trim(slug)) > 0),
  constraint skill_tags_name_en_not_empty check (length(trim(name_en)) > 0),
  constraint skill_tags_name_es_not_empty check (length(trim(name_es)) > 0),
  constraint skill_tags_name_it_not_empty check (length(trim(name_it)) > 0)
);

comment on table public.skill_tags is 'One-level skill tag taxonomy with names in English, Spanish, and Italian.';

create table if not exists public.skill_tag_assignments (
  skill_id uuid not null references public.skills (id) on delete cascade,
  tag_id uuid not null references public.skill_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (skill_id, tag_id)
);

comment on table public.skill_tag_assignments is 'Many-to-many assignments between shared skill records and tags.';

create table if not exists public.skill_external_links (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete cascade,
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skill_external_links_label_not_empty check (length(trim(label)) > 0),
  constraint skill_external_links_url_http check (url ~* '^https?://')
);

comment on table public.skill_external_links is 'Shared ordered external resource links for skills.';

create index if not exists skills_status_published_at_idx
on public.skills (status, published_at desc);

create index if not exists skill_contents_locale_idx
on public.skill_contents (locale);

create index if not exists skill_tag_assignments_tag_id_idx
on public.skill_tag_assignments (tag_id);

create index if not exists skill_external_links_skill_sort_idx
on public.skill_external_links (skill_id, sort_order, id);

create or replace function public.set_skills_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_skills_updated_at on public.skills;
create trigger trg_skills_updated_at
before update on public.skills
for each row
execute function public.set_skills_updated_at();

drop trigger if exists trg_skill_contents_updated_at on public.skill_contents;
create trigger trg_skill_contents_updated_at
before update on public.skill_contents
for each row
execute function public.set_skills_updated_at();

drop trigger if exists trg_skill_tags_updated_at on public.skill_tags;
create trigger trg_skill_tags_updated_at
before update on public.skill_tags
for each row
execute function public.set_skills_updated_at();

drop trigger if exists trg_skill_external_links_updated_at on public.skill_external_links;
create trigger trg_skill_external_links_updated_at
before update on public.skill_external_links
for each row
execute function public.set_skills_updated_at();

alter table public.skills enable row level security;
alter table public.skill_contents enable row level security;
alter table public.skill_tags enable row level security;
alter table public.skill_tag_assignments enable row level security;
alter table public.skill_external_links enable row level security;

drop policy if exists "Public can select published skills" on public.skills;
create policy "Public can select published skills"
on public.skills
as permissive
for select
to anon, authenticated
using (status = 'published'::public.skill_status);

drop policy if exists "Connected admins can select all skills" on public.skills;
create policy "Connected admins can select all skills"
on public.skills
as permissive
for select
to authenticated
using (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
);

drop policy if exists "Connected admins can insert skills" on public.skills;
create policy "Connected admins can insert skills"
on public.skills
as permissive
for insert
to authenticated
with check (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
);

drop policy if exists "Connected admins can update skills" on public.skills;
create policy "Connected admins can update skills"
on public.skills
as permissive
for update
to authenticated
using (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
)
with check (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
);

drop policy if exists "Connected admins can delete skills" on public.skills;
create policy "Connected admins can delete skills"
on public.skills
as permissive
for delete
to authenticated
using (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
);

drop policy if exists "Public can select published skill contents" on public.skill_contents;
create policy "Public can select published skill contents"
on public.skill_contents
as permissive
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.skills s
    where s.id = skill_contents.skill_id
      and s.status = 'published'::public.skill_status
  )
);

drop policy if exists "Connected admins can manage skill contents" on public.skill_contents;
create policy "Connected admins can manage skill contents"
on public.skill_contents
as permissive
for all
to authenticated
using (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
)
with check (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
);

drop policy if exists "Public can select skill tags" on public.skill_tags;
create policy "Public can select skill tags"
on public.skill_tags
as permissive
for select
to anon, authenticated
using (true);

drop policy if exists "Connected admins can manage skill tags" on public.skill_tags;
create policy "Connected admins can manage skill tags"
on public.skill_tags
as permissive
for all
to authenticated
using (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
)
with check (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
);

drop policy if exists "Public can select published skill tag assignments" on public.skill_tag_assignments;
create policy "Public can select published skill tag assignments"
on public.skill_tag_assignments
as permissive
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.skills s
    where s.id = skill_tag_assignments.skill_id
      and s.status = 'published'::public.skill_status
  )
);

drop policy if exists "Connected admins can manage skill tag assignments" on public.skill_tag_assignments;
create policy "Connected admins can manage skill tag assignments"
on public.skill_tag_assignments
as permissive
for all
to authenticated
using (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
)
with check (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
);

drop policy if exists "Public can select published skill external links" on public.skill_external_links;
create policy "Public can select published skill external links"
on public.skill_external_links
as permissive
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.skills s
    where s.id = skill_external_links.skill_id
      and s.status = 'published'::public.skill_status
  )
);

drop policy if exists "Connected admins can manage skill external links" on public.skill_external_links;
create policy "Connected admins can manage skill external links"
on public.skill_external_links
as permissive
for all
to authenticated
using (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
)
with check (
  (auth.jwt() ->> 'user_role') = 'connected_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
);

grant usage on schema public to anon, authenticated;
grant select on table public.skills to anon, authenticated;
grant select on table public.skill_contents to anon, authenticated;
grant select on table public.skill_tags to anon, authenticated;
grant select on table public.skill_tag_assignments to anon, authenticated;
grant select on table public.skill_external_links to anon, authenticated;
grant insert, update, delete on table public.skills to authenticated;
grant insert, update, delete on table public.skill_contents to authenticated;
grant insert, update, delete on table public.skill_tags to authenticated;
grant insert, update, delete on table public.skill_tag_assignments to authenticated;
grant insert, update, delete on table public.skill_external_links to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'skills',
  'skills',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read skills images" on storage.objects;
create policy "Public can read skills images"
on storage.objects
as permissive
for select
to anon, authenticated
using (bucket_id = 'skills');

drop policy if exists "Connected admins can upload skills images" on storage.objects;
create policy "Connected admins can upload skills images"
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'skills'
  and (
    (auth.jwt() ->> 'user_role') = 'connected_admin'
    or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
  )
);

drop policy if exists "Connected admins can update skills images" on storage.objects;
create policy "Connected admins can update skills images"
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'skills'
  and (
    (auth.jwt() ->> 'user_role') = 'connected_admin'
    or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
  )
)
with check (
  bucket_id = 'skills'
  and (
    (auth.jwt() ->> 'user_role') = 'connected_admin'
    or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
  )
);

drop policy if exists "Connected admins can delete skills images" on storage.objects;
create policy "Connected admins can delete skills images"
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'skills'
  and (
    (auth.jwt() ->> 'user_role') = 'connected_admin'
    or (auth.jwt() -> 'app_metadata' ->> 'connected_admin') = 'true'
  )
);

insert into public.skill_tags (slug, name_en, name_es, name_it, sort_order)
values
  ('forestry', 'Forestry', 'Silvicultura', 'Silvicoltura', 10),
  ('fisheries', 'Fisheries', 'Pesca', 'Pesca', 20),
  ('agriculture', 'Agriculture', 'Agricultura', 'Agricoltura', 30),
  ('life-cycle-assessment', 'Life Cycle Assessment', 'Análisis de ciclo de vida', 'Valutazione del ciclo di vita', 40),
  ('eu-taxonomy', 'EU Taxonomy', 'Taxonomía de la UE', 'Tassonomia UE', 50),
  ('biodiversity', 'Biodiversity', 'Biodiversidad', 'Biodiversità', 60),
  ('nature-based-solutions', 'Nature-Based solutions', 'Soluciones basadas en la naturaleza', 'Soluzioni basate sulla natura', 70)
on conflict (slug) do update set
  name_en = excluded.name_en,
  name_es = excluded.name_es,
  name_it = excluded.name_it,
  sort_order = excluded.sort_order;

do $$
declare
  skill_good_practices uuid;
  skill_fisheries uuid;
  skill_forest_carbon uuid;
  skill_urban_resilience uuid;
begin
  insert into public.skills (slug, header_image_path, status, published_at)
  values
    ('good-practices-for-climate-adaptation', null, 'published'::public.skill_status, '2025-11-24T00:00:00Z'),
    ('sustainable-fisheries-in-a-warming-ocean', null, 'published'::public.skill_status, '2025-11-24T00:00:00Z'),
    ('forest-carbon-and-biodiversity-co-benefits', null, 'published'::public.skill_status, '2025-11-24T00:00:00Z'),
    ('nature-based-solutions-for-urban-resilience', null, 'published'::public.skill_status, '2025-11-24T00:00:00Z')
  on conflict (slug) do update set
    status = excluded.status,
    published_at = excluded.published_at;

  select id into skill_good_practices from public.skills where slug = 'good-practices-for-climate-adaptation';
  select id into skill_fisheries from public.skills where slug = 'sustainable-fisheries-in-a-warming-ocean';
  select id into skill_forest_carbon from public.skills where slug = 'forest-carbon-and-biodiversity-co-benefits';
  select id into skill_urban_resilience from public.skills where slug = 'nature-based-solutions-for-urban-resilience';

  insert into public.skill_contents (skill_id, locale, title, body_markdown)
  values
    (skill_good_practices, 'en', 'Good practices for climate adaptation', 'Online courses: Building coastal resilience — good practices for climate adaptation. Discover the tools and methods used by practitioners on the ground.<!-- more -->' || E'\n\nFull skill content is being prepared.'),
    (skill_good_practices, 'es', 'Buenas prácticas para la adaptación climática', 'Cursos en línea: resiliencia costera y buenas prácticas para la adaptación climática. Descubre herramientas y métodos usados por profesionales sobre el terreno.<!-- more -->' || E'\n\nEl contenido completo de esta habilidad está en preparación.'),
    (skill_good_practices, 'it', 'Buone pratiche per l''adattamento climatico', 'Corsi online: resilienza costiera e buone pratiche per l''adattamento climatico. Scopri strumenti e metodi usati dai professionisti sul campo.<!-- more -->' || E'\n\nIl contenuto completo di questa competenza è in preparazione.'),
    (skill_fisheries, 'en', 'Sustainable fisheries in a warming ocean', 'Online courses: Building coastal resilience, good practices for climate adaptation.<!-- more -->' || E'\n\nFull skill content is being prepared.'),
    (skill_fisheries, 'es', 'Pesca sostenible en un océano en calentamiento', 'Cursos en línea: resiliencia costera y buenas prácticas para la adaptación climática.<!-- more -->' || E'\n\nEl contenido completo de esta habilidad está en preparación.'),
    (skill_fisheries, 'it', 'Pesca sostenibile in un oceano che si riscalda', 'Corsi online: resilienza costiera e buone pratiche per l''adattamento climatico.<!-- more -->' || E'\n\nIl contenuto completo di questa competenza è in preparazione.'),
    (skill_forest_carbon, 'en', 'Forest carbon and biodiversity co-benefits', 'Online courses: Building coastal resilience, good practices for climate adaptation.<!-- more -->' || E'\n\nFull skill content is being prepared.'),
    (skill_forest_carbon, 'es', 'Carbono forestal y cobeneficios para la biodiversidad', 'Cursos en línea: resiliencia costera y buenas prácticas para la adaptación climática.<!-- more -->' || E'\n\nEl contenido completo de esta habilidad está en preparación.'),
    (skill_forest_carbon, 'it', 'Carbonio forestale e cobenefici per la biodiversità', 'Corsi online: resilienza costiera e buone pratiche per l''adattamento climatico.<!-- more -->' || E'\n\nIl contenuto completo di questa competenza è in preparazione.'),
    (skill_urban_resilience, 'en', 'Nature-based solutions for urban resilience', 'Online courses: Building coastal resilience, good practices for climate adaptation.<!-- more -->' || E'\n\nFull skill content is being prepared.'),
    (skill_urban_resilience, 'es', 'Soluciones basadas en la naturaleza para la resiliencia urbana', 'Cursos en línea: resiliencia costera y buenas prácticas para la adaptación climática.<!-- more -->' || E'\n\nEl contenido completo de esta habilidad está en preparación.'),
    (skill_urban_resilience, 'it', 'Soluzioni basate sulla natura per la resilienza urbana', 'Corsi online: resilienza costiera e buone pratiche per l''adattamento climatico.<!-- more -->' || E'\n\nIl contenuto completo di questa competenza è in preparazione.')
  on conflict (skill_id, locale) do update set
    title = excluded.title,
    body_markdown = excluded.body_markdown;

  insert into public.skill_tag_assignments (skill_id, tag_id)
  select skill_good_practices, id from public.skill_tags where slug in ('forestry', 'nature-based-solutions')
  on conflict do nothing;

  insert into public.skill_tag_assignments (skill_id, tag_id)
  select skill_fisheries, id from public.skill_tags where slug in ('fisheries', 'eu-taxonomy')
  on conflict do nothing;

  insert into public.skill_tag_assignments (skill_id, tag_id)
  select skill_forest_carbon, id from public.skill_tags where slug in ('forestry', 'biodiversity')
  on conflict do nothing;

  insert into public.skill_tag_assignments (skill_id, tag_id)
  select skill_urban_resilience, id from public.skill_tags where slug in ('nature-based-solutions', 'agriculture')
  on conflict do nothing;

  insert into public.skill_external_links (skill_id, label, url, sort_order)
  values
    (skill_good_practices, 'Example resource', 'https://climate-adapt.eea.europa.eu/', 10),
    (skill_fisheries, 'Example resource', 'https://climate-adapt.eea.europa.eu/', 10),
    (skill_forest_carbon, 'Example resource', 'https://climate-adapt.eea.europa.eu/', 10),
    (skill_urban_resilience, 'Example resource', 'https://climate-adapt.eea.europa.eu/', 10)
  on conflict do nothing;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema in ('human', 'knowledge')
      and table_name in ('skills', 'skill_contents', 'skill_tags', 'skill_tag_assignments', 'skill_external_links')
  ) then
    raise exception 'skills setup must not create skills objects in human or knowledge schemas';
  end if;
end
$$;
