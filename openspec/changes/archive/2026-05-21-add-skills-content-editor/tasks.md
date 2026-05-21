## 1. Supabase Data Model

- [x] 1.1 Add Supabase SQL in the `public` schema for shared skills, localized skill content rows, skill tags, skill-tag assignments, and shared skill external links.
- [x] 1.2 Add localized tag name fields or JSON structure covering English, Spanish, and Italian.
- [x] 1.3 Add publication fields to the shared skill record, including draft/published status and published timestamp.
- [x] 1.4 Add RLS policies that allow public reads of published skills/tags and connected-admin writes.
- [x] 1.5 Add the dedicated Supabase Storage `skills` bucket and policies for connected-admin uploads and public reads of published images.
- [x] 1.6 Commit the skills SQL as a lexically ordered bootstrap file in `packages/supabase-setup/sql/` so `pnpm supabase:bootstrap` can reproduce it in a fresh Supabase project.
- [x] 1.7 Confirm the migration does not add or modify objects in the `human` schema or `knowledge` schema.
- [x] 1.8 Add seed data or migration notes for initial tags and sample skills matching the current static cards.

## 2. Admin Skills Editor

- [x] 2.1 Add "Skills" to the existing admin sidebar navigation.
- [x] 2.2 Create `/admin/skills` using the existing admin layout and `admin-auth` middleware.
- [x] 2.3 Implement skills listing with search, status visibility, and basic actions.
- [x] 2.4 Implement shared skill create/edit form fields for tags, status, header image, and external links.
- [x] 2.5 Reuse the existing markdown editor dependency for skill body authoring.
- [x] 2.6 Implement localized English, Spanish, and Italian content editors containing only title and markdown body.
- [x] 2.7 Add an editor action or help text for inserting the `<!-- more -->` marker and deriving the summary from localized content before it.
- [x] 2.8 Implement Supabase Storage upload or replacement for shared skill header images in the `skills` bucket.
- [x] 2.9 Implement create/edit/delete workflows for localized one-level tags.
- [x] 2.10 Validate required fields, required English/Spanish/Italian tag names, valid URLs, and at least one tag before publish.

## 3. Public Skills Pages

- [x] 3.1 Replace static `useSkillsData()` usage with a Supabase-backed typed data layer for published skills and tag facets in the active locale.
- [x] 3.2 Update `/skills` to render published skill cards, localized tag labels, and counts from Supabase.
- [x] 3.3 Implement tag filtering and the empty state for no matching published skills.
- [x] 3.4 Add public skill detail routing by slug.
- [x] 3.5 Render detail pages with header image, tags, summary derived from `<!-- more -->`, markdown body, and ordered external links.
- [x] 3.6 Return not found for missing or unpublished skill slugs.

## 4. Localization and Content Rules

- [x] 4.1 Document that shared skill records own tags, links, header image, and publication state, while localized rows own only title and markdown body.
- [x] 4.2 Ensure tag labels render in the active locale with a deterministic fallback.
- [x] 4.3 Ensure public list and detail pages only display content appropriate for the active locale.

## 5. Verification

- [x] 5.1 Add focused tests or manual verification steps for RLS behavior: public read, public write rejection, connected-admin writes.
- [x] 5.2 Verify admin create/edit/publish/unpublish/delete flows against Supabase.
- [x] 5.3 Verify image upload failure keeps the previous image reference unchanged.
- [x] 5.4 Verify `/skills` renders published Supabase content and no dummy cards.
- [x] 5.5 Verify `/skills/[slug]` renders markdown and external links for published skills.
- [x] 5.6 Verify the public schema migration leaves `human` and `knowledge` schemas untouched.
- [] 5.7 Verify a fresh environment can apply the committed SQL through `pnpm supabase:bootstrap` using a different `DATABASE_URL`.
- [ ] 5.8 Run typecheck/lint for the web app after implementation.
