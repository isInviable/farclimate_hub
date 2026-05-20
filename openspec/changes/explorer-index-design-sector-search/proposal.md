## Why

The explorer landing page (`pages/explorer/index.vue`) still uses legacy gray Tailwind styling and hard-coded English copy, so it feels disconnected from the editorial explorer shell (`explorer.vue`, `DeliverableHeader`, neutral palette). Sector entry links append `?sector=…` but the main explorer does not turn that into the free-text search query, so users land without the intended filter behavior.

## What Changes

- Restyle the explorer landing page to align with the explorer editorial patterns (neutral / neutral-warm tokens, Nuxt UI primitives, no one-off hex or arbitrary measurements where standard utilities exist).
- Move repeated visual patterns (cards, section spacing, tab-adjacent typography helpers if applicable) into shared CSS variables / `@theme` aliases in `app/assets/css/main.css` or Nuxt UI defaults in `app.config.ts`, reusing conventions already used on `explorer.vue`.
- Replace hard-coded UI strings with i18n keys (all active locales), including page meta where appropriate.
- Extract self-contained blocks into small components under `app/components/` so `index.vue` stays readable.
- On `explorer.vue`, read `route.query.sector` on load (and when the query changes): treat its **decoded string value as the exact free-text query**—the same string the user would see after typing in the explorer search box—and run the same hybrid search path as manual entry. Reserved value `sector=all` means no query (full corpus). Ensure the visible search input is bound to that store value on first paint so it reflects the URL.
- Keep existing `?type=` deep-link behavior coherent (precedence and combination rules documented in design/spec).

## Capabilities

### New Capabilities

- `explorer-index-page`: Landing layout, editorial styling, i18n, and shared token usage for `/explorer` index.
- `explorer-sector-url-bootstrap`: URL `sector` query parameter initializes free-text search on the main explorer page and stays consistent with navigation from the landing page.

### Modified Capabilities

- _(none — behavior is new surface area for the web app; existing backend search specs are unchanged.)_

## Impact

- **Frontend**: `apps/web/app/pages/explorer/index.vue`, new component(s) under `apps/web/app/components/explorer/` (or adjacent), `apps/web/app/pages/explorer/explorer.vue`, `apps/web/app/assets/css/main.css`, possibly `apps/web/app/app.config.ts`, locale JSON files under `apps/web/i18n/locales/`.
- **UX**: Sector buttons and “View all” remain entry points; deep links become meaningful for search.
- **Risk**: Low; additive URL handling and styling. Must define interaction between `sector`, existing `query`, and `type` query params to avoid surprising overwrites.
