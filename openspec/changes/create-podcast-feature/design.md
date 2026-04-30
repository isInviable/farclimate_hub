## Context

The board page currently renders `ActionBarBoard.vue` with a "Create podcast" action, but the parent page opens a static audio modal backed by bundled demo media. The previous podcast API work already defines and implements `POST /api/podcast-summarize`, `POST /api/podcast-text-to-speech`, typed request/response shapes, provider-side validation, and `human.artifacts` podcast rows.

This change is primarily a frontend integration. It should replace the demo podcast modal with a guided creation flow and add a board artifacts section that can show generated podcast rows even when the list is empty.

## Goals / Non-Goals

**Goals:**

- Turn the existing board action into a three-step podcast wizard for selected pins.
- Keep users informed about selected items, validation limits, LLM generation progress, editable script review, and final audio generation status.
- Read existing podcast artifacts for the active project and render a visible Podcasts section with empty, loading, error, and ready states.
- Use existing Nuxt UI components, app composables, Supabase client patterns, and server endpoints.
- Pass richer selected pin context to the summarization endpoint without adding new backend endpoints.

**Non-Goals:**

- Creating or redesigning podcast API endpoints.
- Changing the `human.artifacts` schema or Storage policies.
- Implementing asynchronous job polling beyond the current endpoint response behavior.
- Supporting video or presentation generation.

## Decisions

1. Replace the demo modal with a dedicated wizard component.

   Use a focused component such as `PodcastCreationWizard.vue` opened from `index.vue` when `ActionBarBoard` emits `open-podcast`. Keep the action bar responsible for selection/action triggers only. The wizard owns step state, validation display, endpoint calls, and success messaging.

   Alternative considered: keep all wizard markup in `pages/explorer/board/index.vue`. That would be faster initially but would make the page harder to maintain alongside pin loading, chat, insights, and artifacts.

2. Build selected source payloads from loaded pin rows, not from opaque selection store data alone.

   The UI should map selected pin ids back to `pinsList` and submit `PodcastSelectedSource[]` with stable fields: `id`, title/source snapshot, `bodyKind`, `sourceDocumentUid`, `userNote`, and best available text from `body.data` (`markdown`, `quote`, `fulltext`, `description`, `summary`, `text`). This mirrors the existing server normalizer and keeps source boundaries explicit.

   Alternative considered: send raw selected store entries directly. That risks missing persisted pin metadata and makes frontend behavior depend on the selection store's internal shape.

3. Mirror podcast limits in the UI while preserving server validation as source of truth.

   The UI should show the configured selected-item limit and total text/word estimate before Step 2. Use the existing server constants as the canonical values where they can be shared safely, or duplicate them in a documented frontend-safe constant if the current server utility cannot be imported into client code. Server validation still handles all final enforcement.

   Alternative considered: only validate after calling the endpoint. That gives a worse user experience and makes Step 1 less useful.

4. Use richer context strategies inside the existing payload shape.

   To help Gemini produce better scripts without new endpoints, include structured per-source blocks with title, pin kind, source document uid, user note, selected quote/markdown/full text, and normalized source ordering. Prefer compact but meaningful excerpts over dumping arbitrary objects. If a pin has multiple text candidates, choose the most semantically useful one and show the included text length in Step 1 so users can adjust selection. Extra instructions from the user should be sent unchanged as `extraInstructions`.

   Future additive strategies, if quality is insufficient, include: client-side grouping by article/source before submission, adding source metadata summaries to `body.data`, retrieving article full text for selected source ids through an existing document route, or adding a server-side context expansion endpoint. These are not required for this interface change.

5. Render artifacts as a board section, not another modal-only surface.

   Add an Artifacts area below or alongside `PinBoardView` in `/explorer/board`, with a Podcasts subsection always visible. Query `human.artifacts` for the active project and `kind = 'podcast'`, then render empty help text or a list with listen/download actions. Playback/download should use a private Storage-safe access path, such as signed URLs from Supabase Storage if available in existing client patterns, rather than public demo media paths.

   Alternative considered: show the generated podcast only in the wizard success state. That would not satisfy the requirement that podcasts live in the board artifacts section.

## Risks / Trade-offs

- Frontend/server limit drift -> Prefer shared frontend-safe constants or a single documented mapping, and surface server validation errors verbatim when they occur.
- Selection payload lacks enough source text -> Show item-level included text previews/counts in Step 1 and use best-available text extraction from pin body data.
- Long-running TTS feels like a stalled modal -> Show an explicit generating state and success copy that the artifact will be available in the board Artifacts section after creation.
- Private Storage playback/download may require signed URLs -> Implement artifact access through the existing Supabase authenticated client path and avoid public object URLs.
- The wizard may become too large -> Keep API orchestration and selected-source construction in composables where reuse or testability warrants it.

## Migration Plan

1. Replace the demo podcast modal flow with the wizard while preserving the existing `open-podcast` action contract from `ActionBarBoard`.
2. Add podcast artifact loading for the active project and refresh after successful text-to-speech creation.
3. Remove static demo podcast playback/download controls from the board page.
4. Add focused component/composable tests around wizard validation and endpoint orchestration where the existing test setup supports Nuxt component tests.
