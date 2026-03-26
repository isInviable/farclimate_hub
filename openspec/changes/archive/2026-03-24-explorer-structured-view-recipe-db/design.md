## Context

- **Current UI**: `ArticleStructuredView.vue` posts to `/api/structureArticle`, which calls Gemini to produce markdown sections. Icons and TOC parse `##` headers from that markdown.
- **Data**: `knowledge.recipe` stores `ingredients` JSONB per `(document_id, lang)` with canonical string keys (`context_summary`, `challenges`, `who_is_involved`, etc.) as produced by `augment_with_ai.py`.
- **Explorer document load**: `apps/web/server/api/search.ts` loads full rows via Supabase RPC `get_documents_by_ids` (and `get_all_documents` when query is empty). Those functions today do not join `knowledge.recipe`.

## Goals / Non-Goals

**Goals:**

- Add `recipe_ingredients` to the same RPC payloads the explorer already uses, keyed by `filter_lang`, so the structured tab needs no second round-trip.
- Render each non-empty ingredient through **MarkdownIt** (same family of options as today: `html`, `linkify`, `typographer`) inside **Nuxt UI**-friendly layout (`UCard` per section recommended).
- Remove the AI structuring endpoint used only by this view.
- **Audit** `ArticleStructuredView.vue` and any explorer code updated in the same change (at minimum `ArticleViewAI.vue` props/plumbing) for components that duplicate Nuxt UI: prefer `UButton`, `UAlert`, `USkeleton` / slot loading patterns, `UIcon` (Iconify) over one-off Tailwind-only widgets unless there is no reasonable Nuxt UI equivalent.

**Non-Goals:**

- Translating recipe rows for `es` in the DB (no new pipeline); the UI uses whatever row exists for `filter_lang` (may be absent until pipeline adds non-`en` recipes).
- Changing hybrid/keyword search RPC signatures or ranking behavior.
- Sanitizing markdown beyond what the app already accepts for fulltext (existing pattern).
- **Repo-wide UI refactors** outside the structured-tab scope (other explorer tabs, unrelated pages) unless a trivial shared dependency forces a tiny touch.

## Decisions

### 1. Join recipe in `get_all_documents` / `get_documents_by_ids`

- **Decision**: Add nullable column `recipe_ingredients jsonb` to both functions’ `RETURNS TABLE`, populated with `r.ingredients` from `LEFT JOIN knowledge.recipe r ON r.document_id = d.id AND r.lang = filter_lang`.
- **Rationale**: One query, matches `filter_lang` already used for `fulltext` / `summary_multilang`.
- **Alternatives**: Separate `get_recipe(document_id, lang)` RPC — rejected (extra latency and wiring). Direct Supabase `.from('recipe')` from the browser — rejected (keep document assembly server-side; RLS is OK but RPC already centralizes shape).

### 2. Column name

- **Decision**: `recipe_ingredients` in the RPC result (not `ingredients` alone) to clarify it is the JSON object of sections, not a table row.

### 3. Section order and labels

- **Decision**: Fixed order matching the pipeline canonical keys, with user-facing labels (i18n keys under e.g. `recipe.sections.*`):

  1. `context_summary` — Context summary  
  2. `challenges` — Challenges  
  3. `policy_context` — Policy context  
  4. `legal_aspects` — Legal aspects  
  5. `who_is_involved` — Who is involved  
  6. `economic_data` — Economic data  
  7. `objectives` — Objectives  
  8. `solutions_implemented` — Solution(s) implemented  
  9. `implementation_phases` — Implementation phases and timeline  
  10. `success_and_limiting` — Success and limiting factors  
  11. `benefits` — Benefits  
  12. `lessons_learnt` — Lessons learnt  
  13. `transferability` — Transferability  

- Drop **SDGs** from the UI (no longer in stored ingredients). Reuse or map **Iconify** icons from the current `sectionIcons` map where they still apply; add icons for new sections (`who_is_involved`, `economic_data`, `context_summary`) for parity.

### 4. Component API

- **Decision**: Pass `document` (or minimally `recipeIngredients` + `language`) from `ArticleViewAI.vue`. Prefer `document.recipe_ingredients` from search payload so `ArticleStructuredView` does not fetch. Make `fulltext` optional or unused for the structured tab once recipe-driven (parent may still pass for backward compatibility during rollout).
- **Rationale**: Single source of truth after search load.

### 5. Empty and missing recipe

- **Decision**: If `recipe_ingredients` is null or `{}`, show a neutral empty state (e.g. `UAlert` or short message), not a spinner. No call to Gemini.

### 6. Nuxt UI vs legacy components

- **Decision**: During implementation, explicitly check touched files for: `<button>` + Tailwind used as a control → `UButton`; custom bordered/shadow “panel” stacks → `UCard`; inline error/retry strip → `UAlert` + `UButton`; loading spinner div → Nuxt UI loading/`USkeleton` or `UCard` pending state as appropriate; `<Icon` from legacy patterns → `UIcon` with the same Iconify name where possible.
- **Rationale**: Matches `.cursor/rules/nuxt-vue3-components.mdc` (Nuxt UI first).
- **Escape hatch**: If Nuxt UI has no fit (e.g. highly custom markdown chrome), keep minimal Tailwind and note briefly in a code comment or PR description—avoid large bespoke CSS.

## Risks / Trade-offs

- **[Risk] PostgREST / clients expect fixed RPC columns** → Mitigation: update `search.ts` and TypeScript types in the same change; document **BREAKING** for any external consumer of these two RPCs.
- **[Risk] Large JSON payloads** → Mitigation: acceptable vs fulltext already returned; monitor size if needed later.

## Migration Plan

1. Deploy SQL (`CREATE OR REPLACE` for the two public functions).
2. Deploy web app that reads `recipe_ingredients` and removes `structureArticle` usage.
3. No data backfill required beyond existing pipeline pushes.

## Open Questions

- None blocking; optional later: tighten markdown HTML sanitization if product requires it.
