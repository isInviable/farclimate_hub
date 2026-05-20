## Context

`pages/explorer/index.vue` is the sector gateway: it links to `/explorer/explorer` with `?sector=…` and a free-text path using `?query=…`. The main explorer (`explorer.vue`) uses `bg-neutral-lightest`, editorial tab chrome, and `DeliverableHeader`; the landing page still mixes `gray-*` utilities and raw English copy. Prior work aligned `explorer.vue` view tabs and `DeliverableHeader` with the editorial bar reference (same session as landing parity).

`main.css` exposes brand neutrals (`neutral-*`) and warm-neutral scales (`warm-neutral-*` / mapped Tailwind names per project convention). Implementation SHOULD prefer those tokens over ad hoc colors.

## Goals / Non-Goals

**Goals:**

- Visual and structural consistency between the landing page and `explorer.vue` (surfaces, borders, typography rhythm, Nuxt UI controls).
- All user-visible strings on the landing page routed through i18n for every shipped locale.
- Reusable layout/token helpers centralized in `main.css` or `app.config.ts` when the same pattern appears on both pages (e.g. bordered editorial panels, mono eyebrow text).
- On `explorer.vue`, initialize **free-text** `searchStore.searchQuery` from `route.query.sector` (and keep sidebar facet filters unchanged unless product later asks to sync facets).
- **Passthrough semantics**: the `sector` query value (trimmed, URL-decoded) SHALL be **identical** to what manual typing would put in the search box—no slug-to-label dictionary. Example: `?sector=agriculture` behaves exactly like typing `agriculture` and submitting. **`sector=all`** (case-insensitive per implementation note in code) SHALL mean empty query / `loadAll`.
- The sidebar search field (`FilterManager` / `SearchFilter` or equivalent) SHALL read `searchStore.searchQuery` so that when the URL seeds the store on load or navigation, **the input shows that text immediately**.
- Harmonize URL search params: landing currently sends `query=` but explorer only reads `type`. Support **`query` with fallback to `type`** so both bookmarks and the landing page work.

**Non-Goals:**

- Backend schema or hybrid RPC changes.
- Changing facet definitions or automatically ticking sector checkboxes from `sector=` (unless explicitly added later).
- Redesigning `FilterManager` internals.

## Decisions

1. **Styling source of truth** — Mirror `explorer.vue` outer shell: `min-h-screen bg-neutral-lightest`, bordered sections using `border-neutral-darkest` / `bg-white` where cards are needed. Prefer Tailwind theme colors (`neutral-*`, `warm-neutral-*` when aligned with existing `@theme`) over arbitrary values; prefer `tracking-widest` over custom `tracking-[…]` unless a literal match to `explorer.vue` is required.

2. **Shared utilities** — If landing repeats the same multi-class bundle (e.g. “editorial card”, “mono label”), add `@layer components` entries in `main.css` **or** Nuxt UI `ui` overrides in `app.config.ts` for `UCard` / `UButton` variants used on both pages. Avoid duplicating long class strings across two pages.

3. **Component split** — Extract at least: (a) sector CTA grid, (b) optional “intro / about” block, (c) search strip, as child components under `components/explorer/` (or `components/explorer/landing/`) with props/slots only where needed.

4. **Sector → search string** — Single small helper or composable (e.g. `searchTextFromSectorParam(raw): string | null`) that:
   - Returns `null` for missing/empty `sector` or for reserved `all` (after trim, case rule documented once).
   - Otherwise returns the decoded string **unchanged** (aside from trim), for assignment to `searchStore.searchQuery`.

5. **Mount / watch behavior** — On `explorer.vue`:
   - After corpus metadata load (existing order), resolve initial search text: **`query` or `type` param wins if non-empty** (explicit user/legacy search); else if `sector` yields a non-null string, set store to that string and `hybridSearch`; else `loadAll`.
   - `watch` `route.query` (or specific keys) so client-side navigations from the landing page update the store and refresh results without full reload.
   - When `sector=all`, treat as empty query and run `loadAll` unless `query`/`type` overrides.

6. **i18n** — Namespace keys e.g. `explorer.index.*` for titles, body copy, button labels, placeholders, footer hint; reuse shared labels if they already exist elsewhere.

## Risks / Trade-offs

- **[Risk]** Typos or alternate spellings in `sector=` differ from facet labels → **Mitigation**: product accepts literal match to typed search; landing links should use the exact strings users would type.
- **[Risk]** `query` vs `type` duplication → **Mitigation**: read both with documented precedence.
- **[Risk]** Multi-byte or encoded query strings → **Mitigation**: rely on Vue Router’s decoded `route.query` values; trim only.

## Migration Plan

1. Ship frontend changes behind normal deploy; no DB migration.
2. Verify old bookmarks using `?type=` still work.
3. Rollback: revert page and composable commits.

## Open Questions

- Confirm whether `project-name` on `DeliverableHeader` for the landing page should match explorer (remove prop drift).
