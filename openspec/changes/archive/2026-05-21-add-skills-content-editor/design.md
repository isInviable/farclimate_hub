## Context

The current skills page is a static Nuxt page backed by `useSkillsData()`, with typed placeholder cards and a sidebar taxonomy. The application already has an admin area under `apps/web/app/pages/admin/`, a reusable admin layout, Supabase client usage, Supabase Storage uploads, markdown editing via `md-editor-v3`, and `connected_admin` authorization for elevated editors.

The goal is to turn skills into editorial content without adding a separate CMS. Supabase will own persisted skills data, tags, link lists, and image references. Nuxt will continue to own presentation and routing. This content belongs to the Supabase `public` schema used by the Connected Action public/admin surface, not the `human` schema or `knowledge` schema used by explorer features.

## Goals / Non-Goals

**Goals:**
- Reuse the existing admin panel and `connected_admin` gate for skills editing.
- Store skills, one-level tags, localized tag labels, header images, external links, and publication state in the Supabase `public` schema.
- Support English, Spanish, and Italian skill content with one localized content row per locale containing only title and markdown body text.
- Keep public `/skills` behavior familiar: hero, filter sidebar, and card grid, now populated from published Supabase records.
- Add detail pages for published skills using markdown rendering and the existing visual language.
- Keep the data model simple enough to build quickly and evolve later.

**Non-Goals:**
- Introduce a separate CMS service such as Strapi, Directus, Sanity, or Contentful.
- Build a full block/page-builder system for arbitrary layouts.
- Add nested tag hierarchies or complex taxonomy governance.
- Add real-time collaborative editing, editorial approvals, version history, or scheduled publishing in the first iteration.
- Replace the existing Connected Action admin authorization model.
- Modify the `human` schema or `knowledge` schema.

## Decisions

### Use Supabase tables as the source of truth

Skills content will be stored in Supabase PostgreSQL rather than Nuxt Content files. This allows admin users to edit content from the application without committing files or triggering repository workflows.

Alternative considered: Nuxt Content plus Nuxt Studio. That is a better fit for git-backed content, but it does not align with the requirement to reuse Supabase and the existing admin/users.

### Use the public schema, not human or knowledge

Skills are part of the Connected Action public/admin content model, so new tables will live in the Supabase `public` schema. The `human` schema and `knowledge` schema are reserved for explorer-related data and must not be edited for this feature.

Alternative considered: putting content in a dedicated schema. That could isolate content tables, but it adds exposure/API configuration overhead and is unnecessary for this small public content feature.

### Commit reproducible SQL under supabase-setup

The SQL for skills tables, RLS policies, and the `skills` Storage bucket will be committed in `packages/supabase-setup/sql/` as a lexically ordered bootstrap file, for example `09_skills_content.sql`. The existing root script `pnpm supabase:bootstrap` runs `@farclimate/supabase-setup`, whose runner executes every SQL file in that directory in lexical order against the configured `DATABASE_URL`.

MCP SQL execution may be used only as an iteration or verification aid while designing the schema. It must not be the only place where schema changes exist. A fresh Supabase account must be reproducible from repository SQL plus environment configuration.

Alternative considered: applying SQL only through the Supabase dashboard or MCP. That is fast for experiments but not portable to a different Supabase account or future deployment.

### Reuse the existing admin panel

The new admin section will live beside the current Connected Action admin sections and use the same `admin` layout and `admin-auth` middleware. The admin navigation label can be "Skills".

Alternative considered: a separate `/cms` or `/editor` area. This would create a second administration surface and duplicate auth, navigation, and interaction patterns.

### Keep tags one-level and localize the tag name

Tags will be first-class records with localized names for supported languages, attached to skills through a many-to-many join table. This keeps filtering normalized while avoiding nested taxonomy complexity.

Alternative considered: storing tags as a plain string array on each skill. That is faster initially, but makes localization, de-duplication, and future filtering harder.

### Store one skill content row per locale

Each conceptual skill will have one parent skill record plus locale-specific content rows for English, Spanish, and Italian. The parent skill owns common elements: tag assignments, header image, external links, publication state, and cross-locale identity. Localized rows own only title and markdown body text. The public summary is derived from the localized markdown before the `<!-- more -->` marker.

This scales better as content expands because each translation can have its own title and markdown body without duplicating tags, links, images, or publication metadata across languages.

Alternative considered: one row with JSON or columns for every language. That is simpler for a tiny dataset, but becomes harder to query, validate, and publish independently as the section grows.

### Store markdown as text and render it on public detail pages

The admin editor will save markdown source. Public detail pages will render the saved markdown into HTML using an existing markdown rendering approach and a controlled styling container.

Alternative considered: storing rich editor JSON or HTML. Markdown is easier to review, migrate, and export, and it matches the requested authoring format.

### Derive summaries from a WordPress-style more marker

The summary will be derived from the markdown content before a `<!-- more -->` marker, similar to WordPress. The content after the marker remains the body shown on the detail page. Admin UI should make this marker visible or easy to insert so editors understand how summaries are produced.

Alternative considered: a separate summary field. That is explicit, but it creates duplication and can drift from the article opening. The marker model keeps the editorial flow closer to article writing.

### Model external links as structured data

Each skill will store a shared ordered list of external links as structured records or JSON objects containing at least label and URL. Links are common to the conceptual skill rather than repeated per locale.

Alternative considered: only using markdown links. That keeps the schema smaller but makes link lists harder to validate, style, and query.

### Use publication state for public visibility

Skills will have a draft/published state on the shared parent skill record. Public queries will only return published skills, while connected admins can view and edit both draft and published records.

Alternative considered: all records immediately public. That is simpler but too risky for editorial workflows.

### Use a dedicated skills storage bucket

Skill header images will use a Supabase Storage bucket named `skills`. The header image is common to the conceptual skill rather than localized per content row. Connected admins can upload their own images, and public pages can read images needed for published skills.

Alternative considered: reusing the existing `images` bucket with a `skills/` prefix. A dedicated bucket makes storage policy intent clearer and avoids mixing editorial skill images with other image domains.

### Keep frontend address environment-specific

The skills schema and bootstrap SQL must not hardcode a frontend URL. The frontend already reads Supabase connection values from environment variables (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and server-only keys where needed), so installing the project against another Supabase account or frontend address should require environment changes, not SQL edits.

## Risks / Trade-offs

- Markdown rendering can introduce unsafe HTML if configured loosely → Use a conservative markdown renderer configuration and avoid enabling arbitrary raw HTML unless sanitized.
- Admin writes depend on correct RLS policies → Add policies that allow public reads only for published content and write access only for `connected_admin`.
- Localized tag names can drift if languages are missing → Require every tag to include labels for supported languages before it can be saved or published.
- Image upload and content save can partially fail → Upload images before saving references and surface clear errors in the admin form.
- Public schema tables are exposed through Supabase APIs → Enable RLS on every new table and avoid service-role access from browser code.
- Summary extraction depends on editor discipline → Provide an insert action/help text for the `<!-- more -->` marker and validate publishability when the marker is required.
- The first version will not support content revision history → Keep the schema compatible with future audit/version tables, but do not build them now.

## Migration Plan

1. Add a new committed SQL bootstrap file under `packages/supabase-setup/sql/` for `public` schema parent skills, localized skill content rows, tags, skill-tag assignments, external links, and RLS policies.
2. Add the dedicated `skills` storage bucket and policies in that same reproducible bootstrap SQL path.
3. Build the admin skills CRUD page and add it to the admin sidebar.
4. Replace the static skills data source with Supabase-backed public queries.
5. Add the public skill detail route and markdown renderer.
6. Seed or manually create initial tags and skills matching the current placeholder cards.

Rollback is straightforward before launch: keep the existing static `useSkillsData()` implementation available until the public page is switched to Supabase content. After launch, rollback requires either preserving static seed data or hiding the skills link while data/RLS issues are resolved.

## Open Questions

- Should the `<!-- more -->` marker be mandatory before publishing, or should the first paragraph be used as a fallback when the marker is absent?
