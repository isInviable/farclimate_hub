## Context

Both artifact pipelines build their LLM prompt from selected pins:

- `PowerPointCreationWizard.vue` → `/api/presentation-structure` → `buildPresentationPrompt` (`presentationStructure.ts`).
- `PodcastCreationWizard.vue` → `/api/podcast-summarize` → `buildPodcastPrompt` (`podcastContext.ts`).

Today each pin is emitted as an independent flat `Source N` block. Full article text is fetched (`/api/document-by-uid`) **only** for pins with `body_kind === "document"`; every other kind (notably `selected_text`) sends just its excerpt. The model receives no provenance signal, cannot distinguish primary sources from derived artifacts, and is capped at 60,000 characters (≈1.5% of the Gemini Flash window). `get_document_by_uid` already returns `summary` plus structured metadata (`keywords`, `climate_impacts`, `adaptation_approaches`, `sectors`), but the wizards discard everything except `fulltext`.

## Goals / Non-Goals

**Goals:**
- Give every fragment its full surrounding article context, framed by the user's intent.
- Let the model tell primary sources, user-selected salience, and derived synthesis apart.
- Deduplicate repeated references to the same article.
- Use a realistic context budget with graceful degradation instead of hard failure.
- Share one context-assembly implementation across both pipelines.

**Non-Goals:**
- No database schema changes; reuse fields already returned by `get_document_by_uid`.
- No new LLM provider or model; keep `gemini-3.1-flash-lite` default and existing model config.
- No change to the public request/response API shape of the two endpoints.
- No change to the Google TTS 4,000-byte output limit on podcast scripts.

## Decisions

### 1. Document-centric input model (vs. flat list)
Group selected pins by `source_document_uid`. Each group becomes one source with: the full article text included **once**, plus its derived fragments as typed annotations. Pins without a `source_document_uid` become standalone "loose" sources. Chosen over the flat list because dedup, full-context, and provenance all fall out naturally from grouping.

### 2. Provenance taxonomy
Map `body_kind` → provenance for the prompt:

| Provenance | From `body_kind` | Model guidance |
|---|---|---|
| `primary_source` | fetched fulltext | Authoritative; ground all facts here. |
| `user_highlight` | `selected_text`, `text_segment`, `recipe_section` | Salience signal — prioritize these in output. |
| `user_note` | `user_note` on any pin | Explicit intent; honor it. |
| `derived_synthesis` | `ai_summary`, `grid_compare_summary`, `markmap`, `chat_response` | User's prior synthesis; framing only, not new evidence; do not double-count. |
| `visual_asset` | `image` (PPT only) | Reference by `sourceId` only. |

### 3. Tagged block format
Emit XML-style delimited blocks with **user intent first, full text last** (earlier/fenced content is weighted higher and prevents a short highlight from drowning under a long article). A short "How to use the material" guidance section precedes the source dump in both prompts.

### 4. Token budget + degradation
- Budget: ~500,000 character-equivalent (≈50% of window). Estimate tokens as `chars / 4`.
- Compute each source's ideal detail level: full-document pin → `full_text` (the user asked for the whole article); fragment-backed source (`selected_text`, `text_segment`, `recipe_section`) → `full_text`.
- **Full-document pins are never degraded.** A pin that explicitly pinned the whole article always keeps full text; we never substitute its summary.
- If over budget, degrade **fragment-backed sources only**: `full_text → summary` (db summary + structured metadata), keeping the verbatim highlight. Recompute after each downgrade and stop as soon as it fits.
- If, after all fragment sources are reduced to summaries, the context still exceeds the budget (e.g. many large full-document pins), do **not** degrade further — fall back to the existing behavior: block generation and ask the user to select fewer items.
- `user_focus` (verbatim highlights + notes) is **never** dropped. Degraded fragment sources are relabeled (`provenance="summary_only"`) and carry a `note_to_model` stating the body was omitted.
- Summary fallback when DB `summary` is empty: subtitle + leading fulltext slice, else structured metadata only.
- When any source is substituted with a summary to fit the budget, surface a UI note telling the user summaries are being used; no manual toggle.

### 5. Filtering rules
Exclude `contact` / `website` from both formats. `image` stays PowerPoint-only as `visual_asset`; excluded from podcast text assembly.

### 6. Shared assembler
Extract a single context-assembly util (grouping, provenance, budgeting, degradation, block rendering) consumed by both `presentationStructure.ts` and `podcastContext.ts`, so prompt-structure rules don't drift between pipelines.

## Risks / Trade-offs

- [Highlight "drowning" under a long article] → user_focus-first ordering + explicit weighting in guidance; verify with an eval after build.
- [Same article pinned as both `document` and highlights] → dedup merges into one source; the full-document pin pins the ideal level to `full_text` and is exempt from degradation.
- [Many large full-document pins blow the budget] → full-document pins are not degradable, so we fall back to asking the user to select fewer items (current behavior) rather than silently summarizing what they explicitly pinned in full.
- [Larger prompts raise latency and per-call cost] → 500k cap is a ceiling, not a target; degradation keeps typical calls small; surface the token estimate in the UI so users see context size.
- [`chars / 4` token estimate is approximate] → conservative ceiling (50% of window) absorbs estimation error; can swap for a real tokenizer later without spec change.
- [Empty/low-quality DB summaries] → explicit summary fallback chain; metadata always included as a floor.
- [Behavioral change to generated output] → not an API break, but artifacts will differ; communicate as a quality improvement.

## Migration Plan

1. Add shared context-assembly util with provenance + degradation; unit-test in isolation.
2. Switch server prompt builders to consume it (behind existing endpoints).
3. Expand wizard fulltext loading to any pin with `source_document_uid`; keep `summary` + metadata from the fetch.
4. Update context-size UI to token estimate + degradation indicator.
5. Rollback: revert prompt builders to the flat-list path; no data migration to undo.

## Resolved Decisions

- **No manual "use summaries" toggle.** Degradation is automatic; when summaries are substituted to fit the budget, the wizard shows a note.
- **Full-document pins are never summarized.** If the selection is too large even after fragment sources are reduced to summaries, block and ask the user to select fewer items (current behavior).
- **`text_segment` / `recipe_section` expand to the full article** (like `selected_text`) whenever a `source_document_uid` is available; they fall back to their excerpt only when no parent document exists.
