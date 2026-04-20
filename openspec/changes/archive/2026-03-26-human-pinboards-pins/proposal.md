## Why

Users need a durable place inside each project to curate knowledge references and personal artifacts (text, images, links, chat excerpts) without coupling user data to regenerable `knowledge` rows. Pinboards and pins provide that layer with logical document identity (`source_document_uid` + title snapshot), versioned JSON bodies, and owner-only access consistent with `human.projects`.

## What Changes

- Add `human.pinboards` (1:1 with `human.projects`) created automatically via trigger on project insert.
- Add `human.pins` with optional logical document fields, `body_kind`, versioned `body` jsonb (`v` = 1), `user_note`, `sort_order`; cascade delete when project or pinboard is removed.
- Row-level security on both tables derived from project ownership (`owner_user_id = auth.uid()`), with no access for `anon`, matching existing human project policies.
- Dedicated Storage bucket for pin images with owner-scoped paths; copy source image into user bucket on pin create; best-effort delete object when pin is deleted.
- Extend `packages/supabase-setup` ordered SQL (same style as existing human bootstrap: comments, indexes, validation blocks where appropriate) — **not** `packages/db`, which remains the regenerable `knowledge` domain only.
- Automated backend tests exercising pinboard/pin CRUD and RLS using an authenticated **demo/test** user (Vitest + Supabase client or equivalent pattern used in `apps/web/tests/api`).

## Capabilities

### New Capabilities

- `human-pinboards-pins`: PostgreSQL tables, trigger, RLS, grants, indexes, bootstrap reproducibility, logical document fields, body envelope contract, beta size/count limits (generous), backend test requirements for owner vs other-user vs anon.
- `human-pin-storage`: Supabase Storage bucket definition, RLS policies on `storage.objects`, integration with pin lifecycle (copy on create, delete on pin delete).

### Modified Capabilities

- (none) — existing `human-projects` requirements are unchanged at the spec level; pinboard creation is an additive database behavior documented under `human-pinboards-pins`.

## Impact

- **Affected systems:** `packages/supabase-setup/sql/` (new ordered script after `04_human_projects.sql`), `packages/supabase-setup/README.md`, optional `packages/supabase-setup` or `apps/web` test suite for RLS/CRUD.
- **Frontend:** out of scope for this change proposal (follow-up change can add Nuxt UI); API principle remains direct Supabase client for simple CRUD, server routes recommended for multi-step image copy.
- **Knowledge domain:** no foreign keys from `human.pins` to `knowledge.*`; resolution of `source_document_uid` stays application-side.
