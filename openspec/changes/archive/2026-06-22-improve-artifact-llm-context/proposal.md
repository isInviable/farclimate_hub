## Why

The PowerPoint and Podcast creation wizards feed pinned items to the LLM as a flat list of independent text blocks. When a user pins a *highlight* from an article, the model only receives the highlighted excerpt — not the article it came from, and no signal that it was a deliberate selection. The model also cannot distinguish a primary source (full article) from a derived artifact (an AI summary, a mind map, a chat answer), so generated decks and scripts lose accuracy and miss the user's intent. The current 60,000-character context cap is also ~1.5% of the model's real window, forcing needless truncation.

## What Changes

- Load full article text for **any** selected pin that has a `source_document_uid`, not just pins whose `body_kind === "document"`.
- Restructure the LLM input from a flat per-pin list into a **document-centric** model: one article (full text included once) with the user's engagements (highlights, notes, summaries, mind maps, chat answers) attached as typed, provenance-labeled annotations.
- Introduce a **provenance taxonomy** (`primary_source`, `user_highlight`, `user_note`, `derived_synthesis`, `visual_asset`) and explicit prompt guidance telling the model how to weight each type.
- **Deduplicate by `source_document_uid`**: when an article appears as several pins (full doc + highlights + summaries), include its full text once and list all derived fragments under it.
- Raise the context budget to ~500,000 character-equivalent (≈50% of the model window) and estimate tokens as `chars / 4`.
- Add a **graceful degradation ladder**: when over budget, replace a source's full text with the article's database `summary` (+ structured metadata), then with highlights-only, in priority order — **never dropping the user's verbatim highlights or notes**.
- Filtering rules: exclude `contact` / `website` pins from both formats; `image` pins remain PowerPoint-only (visual asset), excluded from podcast text.
- Always include compact structured metadata (climate impacts, adaptation approaches, sectors, keywords) for each article regardless of detail level.

## Capabilities

### New Capabilities
- `artifact-source-context`: Shared, document-centric assembly of LLM context for generated artifacts — grouping pins by source document, provenance labeling, full-article loading with user-intent framing, token budgeting, and the full-text → summary → highlights-only degradation ladder. Consumed by both the presentation and podcast pipelines.

### Modified Capabilities
- `presentation-structure-generation-api`: Prompt and input structure change to consume the document-centric, provenance-labeled context; raised context budget with degradation.
- `podcast-generation-api`: Prompt and input structure change to consume the document-centric, provenance-labeled context; raised context budget with degradation; `contact`/`website`/`image` excluded.
- `powerpoint-generation-ui`: Selected-source loading expands to fetch full article text for any pin with a `source_document_uid`; context-size indicator reflects token estimate and degradation.

## Impact

- Frontend: `PowerPointCreationWizard.vue`, `PodcastCreationWizard.vue` (source loading + context-size UI), `powerPointSelection.ts`, `podcastSelection.ts` (filtering, provenance, carry parent uid).
- Server: `presentationStructure.ts`, `podcastContext.ts` (prompt builders), a new shared context-assembly util, `document-by-uid.get.ts` consumers (keep `summary` + metadata).
- No new external dependencies; no database schema change (uses existing `summary` and structured fields already returned by `get_document_by_uid`).
- Behavioral change to generated artifact content (quality-improving, not breaking the API contract).
