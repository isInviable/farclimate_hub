## 1. Database (public RPCs)

- [x] 1.1 Extend `public.get_all_documents` and `public.get_documents_by_ids` in `packages/db/sql/06_public_api.sql` with `recipe_ingredients jsonb` and `LEFT JOIN knowledge.recipe` on `(document_id, filter_lang)`
- [x] 1.2 Apply the same definition to the deployed database (re-run `db:create` or run an equivalent `CREATE OR REPLACE` migration in your environment)

## 2. Search API and types

- [x] 2.1 Map `recipe_ingredients` through `apps/web/server/api/search.ts` into each hit’s `document`
- [x] 2.2 Add `recipe_ingredients` (optional JSON) to `SearchDocument` / related types in `apps/web/app/types/search.d.ts` and `apps/web/app/types/index.ts` as needed

## 3. Structured view UI

- [x] 3.1 Refactor `ArticleStructuredView.vue` to `<script setup lang="ts">`, accept `recipe_ingredients` (and props needed for TOC), remove `$fetch('/api/structureArticle')`
- [x] 3.2 Render sections in the fixed key order; skip empty strings; use MarkdownIt for bodies; use Nuxt UI (`UCard`, `UIcon`) per design
- [x] 3.3 Add i18n keys for section labels under a `recipe.sections.*` (or equivalent) namespace with English fallbacks
- [x] 3.4 Update `ArticleViewAI.vue` to pass `document.recipe_ingredients` into the structured view (stop requiring `fulltext` for structured tab if props change)
- [x] 3.5 Audit `ArticleStructuredView.vue` and touched explorer parents (`ArticleViewAI.vue`, etc.) for legacy patterns (raw `<button>`, bespoke cards, spinner-only loading, `<Icon` vs `UIcon`); list replacements against [Nuxt UI](https://ui.nuxt.com)
- [x] 3.6 Apply Nuxt UI replacements found in 3.5 (document any intentional exceptions where no component fits)

## 4. Cleanup

- [x] 4.1 Delete `apps/web/server/api/structureArticle.ts` and confirm no remaining references

## 5. Verification

- [x] 5.1 Load a document with a populated `knowledge.recipe` row in the explorer and confirm the structured tab matches DB content
- [x] 5.2 Load a document without a recipe row and confirm the empty state (no LLM call)
