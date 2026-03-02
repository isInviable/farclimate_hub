## 1. Types and Data Shape

- [x] 1.1 Create or update a global `ArticleDetail` (or similarly named) type in `apps/web/app/types/` that is composed primarily from `SearchResult` and mirrors the fields used by the side panel.
- [x] 1.2 Ensure `ArticleDetail` uses identifiers present in the Supabase-backed schema (`document_uid`, `id`) and does not depend on `local_id` or other ORAMA-only fields.
- [x] 1.3 Add any additional, well-defined fields needed by the side panel (e.g. parsed `geographic_characterisation`, `implementation_years`, `websites`) to the global types, marking them optional where appropriate.

## 2. Align ArticleSidePanel.vue with Global Types

- [x] 2.1 Convert `apps/web/app/components/explorer/ArticleSidePanel.vue` to `<script setup lang="ts">` and type its `document` prop as `ArticleDetail`.
- [x] 2.2 Replace usages of `document.local_id` with identifiers available in the current dataset (e.g. `document.document_uid` or `id`) and adjust link construction accordingly.
- [x] 2.3 Audit `ArticleSidePanel.vue` for any references to fields not present in `ArticleDetail` and either map them from existing data or mark them as missing for the report.

## 3. Wiring and Data Flow

- [x] 3.1 Update the place where the side panel is opened (e.g. in `explorer.vue` or related store) to pass a properly typed `ArticleDetail` object derived from the search store’s `SearchResult` hits.
- [x] 3.2 Add a small helper or mapping function (if needed) that converts a `SearchResult` into `ArticleDetail` in a single, well-typed place.
- [x] 3.3 Verify that clicking a search result still opens the side panel with the correct article and that navigation links (e.g. to full article view) work with the new identifiers.

## 4. Missing Data Handling and Report

- [x] 4.1 Identify all sections in `ArticleSidePanel.vue` that rely on fields not currently provided by the Supabase-backed dataset (based on `SearchResult` and DB schema).
- [x] 4.2 Comment out those sections in the template and script, adding clear TODO comments that reference the missing-data report.
- [x] 4.3 Create `openspec/changes/fix-article-side-panel/missing-data-report.md` and document each missing field/section, its intended meaning, and any plausible future data source.

## 5. Verification

- [x] 5.1 Run the Nuxt dev server and manually verify that the side panel opens without runtime errors for multiple articles in both English and Spanish.
- [x] 5.2 Confirm that the side panel renders correctly when optional fields (e.g. sectors, geographic_characterisation, implementation_years, websites) are present and when they are absent.
- [x] 5.3 Grep the codebase for `local_id` usages in the explorer context and ensure none remain in the side-panel path.
- [ ] 5.4 Run type-checking (`pnpm typecheck` or equivalent) and fix any new TypeScript errors related to the side panel and global types.

