# @farclimate/supabase-setup

One-time bootstrap pipeline for a brand-new Supabase environment.

This package is intentionally separate from `packages/db`:

- `packages/db` manages the regenerable `knowledge` domain and can be dropped/recreated repeatedly.
- `packages/supabase-setup` manages durable platform setup that should exist once per fresh Supabase project, such as auth/RBAC bootstrap and `human` domain ownership scaffolding.

## What it applies

The bootstrap runner executes every `.sql` file in `sql/` in lexical order.

Current setup includes:

1. `01_connected_admin_rbac.sql`
   - Creates the minimal application role model for elevated users only.
   - Creates `public.user_roles`.
   - Enables RLS and grants the minimum access needed for Supabase Auth to read assignments.

2. `02_connected_admin_auth_hook.sql`
   - Creates `public.is_connected_admin(uuid)`.
   - Creates `public.custom_access_token_hook(jsonb)`.
   - Creates `public.assign_connected_admin(...)` and `public.revoke_connected_admin(...)`.

3. `03_human_profiles.sql`
   - Creates durable schema `human`.
   - Creates `human.profiles` with one-to-one identity mapping to `auth.users(id)`.
   - Enables owner-only RLS (`id = auth.uid()`) for `select` and `update` to `authenticated`.
   - Creates an auth trigger/function so new auth users automatically get a profile row.
   - Includes validation checks to prevent `anon` access and broad cross-user policy mistakes.

4. `04_human_projects.sql`
   - Creates `human.projects` as the root workspace container with direct ownership (`owner_user_id` → `auth.users(id)`).
   - Enables owner-only RLS for `insert`, `select`, `update`, and `delete` so authenticated users can CRUD only their own projects.
   - Ensures `anon` has no project access; includes validation checks for policy shape.

5. `05_expose_human_schema.sql`
   - Exposes the `human` schema to the Supabase REST API (PostgREST). Without this, requests to `human.projects` or `human.profiles` return **406 Not Acceptable**. Run bootstrap at least once so list/create/update/delete from the frontend work.
   - **Supabase JS:** use `client.schema('human').from('projects')` (and similarly for `pinboards`, `pins`, `profiles`, `saved_searches`). Using `.from('human.projects')` is wrong: PostgREST treats that as a single table name in `public`, which produces **PGRST205** (“Could not find the table `public.human.projects`”).

6. `06_human_pinboards_pins.sql`
   - Creates `human.pinboards` (exactly one per project, `UNIQUE(project_id)`).
   - Creates `human.pins` with optional `source_document_uid` / `source_title_snapshot` (logical knowledge refs only — **no FK to `knowledge`**), `body_kind`, JSONB `body` with enforced envelope `{"v":1,"data":{...}}` (beta: `v` must be `1`, body size cap **512 KiB**), `user_note`, `sort_order`.
   - Trigger on `human.projects` **after insert** creates the pinboard row; existing projects without a pinboard get a backfill `INSERT` on bootstrap.
   - Owner-only RLS on pinboards and pins via `human.projects.owner_user_id = auth.uid()` (including **cascade deletes** when a project is removed). `anon` has no table access.
   - Beta product limits (documented; pin count **10k** per pinboard enforced in app if needed): `body_kind` max **128** chars.

7. `06_saved_searches.sql`
   - Creates `human.saved_searches` scoped to projects (named filter snapshots).

8. `07_human_pin_storage.sql`
   - Creates private Storage bucket **`human-pin-images`** (beta: **20 MiB** max object, MIME `image/jpeg`, `image/png`, `image/webp`, `image/gif`).
   - RLS on `storage.objects`: authenticated users may only read/write objects whose path’s **first segment** equals `auth.uid()` (convention `{uid}/{pin_id-or-segment}/{filename}`). Use a **server route or service role** to copy platform/knowledge images into this bucket when creating image pins.

9. `08_human_artifacts.sql`
   - Creates `human.artifacts` for generated user artifacts such as podcasts and pinboard ZIP exports (`kind` values like `podcast`, `pinboard_export`). Rows store metadata and Storage references only; binary files live in Storage.
   - Creates private Storage bucket **`human-artifacts`** (beta: **50 MiB** max object; MIME examples include `audio/mpeg`, `audio/mp3`, `application/zip` for exports).
   - Owner-only RLS on `human.artifacts` via `owner_user_id = auth.uid()` and project ownership checks. `anon` has no table access.
   - RLS on `storage.objects`: authenticated users may only read/write objects whose path’s **first segment** equals `auth.uid()` (convention `{uid}/{project_id}/{artifact_id}/podcast.mp3` or `.../pinboard-export.zip`).

10. `08_article_images_storage.sql`
   - Creates public Storage bucket **`article-images`** for regenerable knowledge/article images written by the data pipeline.

## Usage

From the repo root:

```bash
pnpm supabase:bootstrap
```

Or directly:

```bash
cd packages/supabase-setup
pnpm bootstrap
```

The runner expects:

- `DATABASE_URL` in the repo root `.env`

## After the SQL finishes

The SQL creates the Postgres function used by Supabase Auth, but the hosted project still needs one dashboard configuration step:

1. Open Supabase Dashboard.
2. Go to `Authentication > Hooks`.
3. Set the Custom Access Token Hook to `public.custom_access_token_hook`.

Without that dashboard step, new JWTs will not include the `connected_admin` claim even though the function exists in the database.

At the same time, the bootstrap SQL provisions `human.profiles`, `human.projects`, pinboards/pins, optional saved searches, generated artifact metadata, and Storage buckets for pin images and generated artifacts: authenticated users can persist profile metadata and preferences, own projects with an auto-created pinboard, curate pins under RLS, store generated artifact metadata, and use Storage for pin images/artifacts under their UUID prefix — all with ownership enforced by RLS. The Storage buckets and policies are created entirely via SQL; no extra dashboard step is required for bucket creation on hosted Supabase beyond running bootstrap.

## Managing elevated users

After a real auth user exists, grant elevated access with:

```sql
select public.assign_connected_admin('<auth-user-id>'::uuid);
```

To revoke it:

```sql
select public.revoke_connected_admin('<auth-user-id>'::uuid);
```

Changes to role assignments take effect on the next token refresh or next sign-in.

## Relationship to the knowledge pipeline

Run this bootstrap pipeline once when creating a new Supabase project.

After that, use the knowledge pipeline independently:

```bash
pnpm db:create
pnpm db:push
```

Those commands are safe to use repeatedly for the regenerable `knowledge` domain and do not replace this one-time environment bootstrap.
