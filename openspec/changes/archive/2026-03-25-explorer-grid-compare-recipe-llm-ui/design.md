## Context

Search hits already expose `document.recipe_ingredients` (canonical string keys per `knowledge-recipe`). `ViewModeGrid` still reads legacy keys (`cost_benefit`, `implementation_time`, etc.) that are not present on the hit payload, so `fetchSummary` exits before calling `/api/summarizeProperty`. The summarize endpoint today accepts a free-form `text` blob and uses Gemini structured output (`title`, `summary`, `data`). The grid mixes Nuxt UI (`USelect`, `UCheckbox`, `UButton`) with raw `<button>` elements for pagination stubs.

## Goals / Non-Goals

**Goals:**

- Resolve comparison source text from **recipe sections** (and existing short fields) with an explicit **mapping** from each dropdown value to ingredient key(s) or field names.
- Preserve **LLM compression** for comparison: bounded input can still be multiple paragraphs; output stays **very short** (about one to two sentences) with emphasis on **keywords and numeric figures**, matching product needs.
- Add **custom user question** mode: a text box captures the user instruction; each article receives the same instruction plus a **small, consistent context block** so answers are comparable.
- Align grid controls with **Nuxt UI** (`USelect`/`USelectMenu`, `UInput`/`UTextarea`, `UPagination` or placeholders that are clearly disabled Nuxt UI, etc.) per project rules.

**Non-Goals:**

- Changing hybrid/keyword search RPCs or hit shape (already includes `recipe_ingredients`).
- Persisting user custom prompts server-side or across sessions (unless trivially via URL later).
- Replacing markdown rendering in cards with a new renderer.

## Decisions

1. **Source resolution (predefined features)**  
   - **Decision**: Maintain a single **mapping table** in the grid (or a tiny composable) from `select` value → `{ type: 'field' | 'recipe', key: string }`.  
   - **Examples** (exact keys per `knowledge.recipe` comment): `cost_benefit` → `economic_data`; `implementation_time` → `implementation_phases`; `lifetime` → `benefits` (heuristic: duration/outcomes often appear there; adjust if product prefers another key); `stakeholder_participation` → `who_is_involved`; `success_limitations` → `success_and_limiting`; “summary” / subtitle row → use `subtitle` only, **no LLM** (current behavior).  
   - **Rationale**: Keeps one source of truth aligned with DB; avoids reintroducing legacy columns.  
   - **Alternatives**: Extend `get_documents_by_ids` with denormalized legacy columns (**rejected**: duplicates recipe).

2. **Custom compare: what text goes to the LLM**  
   - **Decision**: For each hit, build **context** = `title` + `subtitle` + `summary` (multiline summary field from search) truncated to a **character budget** (e.g. 2–4k chars), plus the user’s **instruction** in the prompt. Optionally append **concatenated non-empty recipe sections** capped by the same budget if title+summary are thin—**pick one policy in implementation** and document in code comment.  
   - **Rationale**: User question is cross-cutting; full `fulltext` would defeat optimization. Title + subtitle + summary + bounded recipe is usually enough for “compare X across cases.”  
   - **Alternatives**: Only recipe sections (**rejected**: user may ask about something only in summary); full `fulltext` (**rejected**: cost/latency).

3. **API shape**  
   - **Decision**: Extend `POST /api/summarizeProperty` body to accept `mode: 'property' | 'custom'`, `property` (for predefined), `userPrompt` (for custom), `text` (server-trusted bounded excerpt built client-side), and keep `cacheId`. Validate: non-empty `text` for LLM modes; `userPrompt` required when `mode === 'custom'`.  
   - **Rationale**: Minimal new routes; clear branching in one handler.  
   - **Alternatives**: New `/api/summarizeCustom` (**rejected**: duplicate caching/model config).

4. **Prompts**  
   - **Decision**: Two system-style prompt branches: (a) **property** — current structured behavior (title, summary, data) with explicit “1–2 sentences” and bold figures; (b) **custom** — answer the user question only in the same structured fields or map `summary` to the answer and use `title` as a 3–5 word label.  
   - **Rationale**: Reuses `generateObject` schema and UI rendering.

5. **Nuxt UI**  
   - **Decision**: Replace raw pagination `<button>`s with `UPagination` wired to local state **or** `UButton` with `icon` only and `disabled` until real pagination exists; use `UFormField` + `UTextarea` for custom prompt; ensure `USelect` uses primitive `value` binding (if the component binds whole items, set `value-key` or switch to `USelectMenu` with `value-key="value"` like other admin pages).  
   - **Rationale**: Matches codebase patterns in `entities.vue` / `products-custom.vue`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Empty recipe section → no LLM input | Show fallback line-clamp from available field or “No data for this section”; do not call API. |
| Custom mode still large if summary is huge | Client-side truncate before POST; server may second-truncate defensively. |
| Cache collisions | Include `mode`, `property` or hash of `userPrompt`, and language in `cacheId`. |
| Gemini latency on many cards | Keep sequential or small concurrency cap; optional loading skeleton (already partially present). |

## Migration Plan

1. Ship frontend mapping + API body changes together.  
2. No DB migration.  
3. Rollback: revert client mapping and API optional fields (handler accepts previous body if backward compatible—prefer keeping `text` + `property` as today).

## Open Questions

- Whether **custom** mode should include **one** concatenated recipe string vs title+summary only—implementer should choose the default in code and add a short comment; spec can require “bounded context, no full `fulltext`.”
- i18n strings for the new dropdown option and placeholder text for the custom field (EN + ES).
