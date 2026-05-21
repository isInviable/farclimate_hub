## Why

The skills section currently renders static placeholder data, but the content model is editorial: skills need tags, rich markdown, images, summaries, and external links that non-developer administrators can maintain. Reusing the existing Supabase-backed admin panel keeps the system simple and avoids introducing a separate CMS or backend.

## What Changes

- Add a new "Skills" section to the existing admin panel, gated by the same `connected_admin` authorization used by current admin pages.
- Add a one-level skills tag taxonomy where each tag stores names in English, Spanish, and Italian.
- Store skills in the Supabase `public` schema, with one shared skill record for common elements and one localized content row per locale for English, Spanish, and Italian.
- Store common skill elements once: tags, header image, publication state, and a list of external links.
- Store localized skill elements per locale: title and markdown body text, with the summary extracted from a WordPress-style `<!-- more -->` marker in the localized markdown.
- Provide admin workflows to create, edit, publish/unpublish, and delete skills and tags.
- Replace the public `/skills` page's static data source with Supabase-backed published skills while preserving the current card/grid/filter experience.
- Add public skill detail pages that render each skill's header image, tags, summary, markdown body, and external links.

## Capabilities

### New Capabilities
- `skills-content-management`: Admin and backend behavior for managing skills, localized tags, markdown content, images, summaries, external links, and publication state in Supabase.

### Modified Capabilities
- `skills-page`: The public skills page changes from typed static placeholder data to published Supabase content with tag filtering and detail navigation.

## Impact

- Affected app areas: `apps/web/app/pages/admin/`, `apps/web/app/layouts/admin.vue`, `apps/web/app/pages/skills.vue`, new public skill detail routing, and skills-related composables/components.
- Affected backend systems: Supabase PostgreSQL tables in the `public` schema, RLS policies, and a Supabase Storage `skills` bucket for skill header images.
- Reused systems: existing `connected_admin` role checks, admin layout/navigation, Supabase client usage, and the existing markdown editor dependency.
- No separate CMS, service, or authentication system is introduced.
- Out of scope: changes to the `human` schema and `knowledge` schema used by the explorer.
