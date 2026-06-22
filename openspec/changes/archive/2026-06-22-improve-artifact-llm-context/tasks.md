## 1. Shared context-assembly module

- [x] 1.1 Define provenance types and a `body_kind` → provenance map (primary_source, user_highlight, user_note, derived_synthesis, visual_asset)
- [x] 1.2 Implement grouping of pins by `source_document_uid` (dedup), with loose-source handling for pins without a uid
- [x] 1.3 Define the per-source level-of-detail model (full_text, summary_only) and ideal-level rules (full-document pin → full_text; fragment-backed source → full_text)
- [x] 1.4 Implement token estimation (chars/4) and the 500k character-equivalent budget constant (configurable)
- [x] 1.5 Implement degradation: reduce fragment-backed sources full_text → summary only; never degrade full-document pins; if still over budget after summarizing all fragments, signal "selection too large" rather than degrading further; never drop verbatim highlights/notes
- [x] 1.6 Implement summary fallback chain (db summary → shortened excerpt → structured metadata) so degraded sources are never empty
- [x] 1.7 Implement tagged source-block rendering (user_focus first, full_text last) plus the "How to use the material" guidance block
- [x] 1.8 Apply filtering rules (exclude contact/website; image as visual_asset for PPT only, excluded from podcast text)
- [x] 1.9 Unit-test the module: grouping/dedup, provenance labeling, budget fitting, each degradation step, summary fallback, filtering

## 2. Server prompt builders

- [x] 2.1 Refactor `presentationStructure.ts` `buildPresentationPrompt` to consume the shared module (keep image gating + slide schema rules)
- [x] 2.2 Refactor `podcastContext.ts` `buildPodcastPrompt` to consume the shared module (exclude contact/website/image)
- [x] 2.3 Replace the hard `MAX_CONTEXT_CHARS` rejection with budget + fragment degradation in both validation paths; keep empty-selection rejection and the "select fewer items" error when still over budget after summarizing
- [x] 2.4 Update existing server tests for the new document-centric prompt shape and degradation behavior

## 3. Document fetch + frontend wiring

- [x] 3.1 Expand `selectedDocumentUids` in `PowerPointCreationWizard.vue` to include any selected pin with a `source_document_uid`
- [x] 3.2 Expand the equivalent loader in `PodcastCreationWizard.vue`
- [x] 3.3 Retain `summary` and structured metadata (keywords, climate_impacts, adaptation_approaches, sectors) from the `document-by-uid` fetch, not just `fulltext`
- [x] 3.4 Update `powerPointSelection.ts` and `podcastSelection.ts` to carry provenance + parent uid and apply filtering (drop contact/website; image PPT-only)

## 4. Context-size UI

- [x] 4.1 Replace the character-count context badge with a token estimate in both wizards
- [x] 4.2 Show a note when fragment-backed sources are summarized to fit (no manual toggle); keep the "select fewer items" message when still too large
- [x] 4.3 Add/adjust i18n strings (en/es/it) for token-size, summaries note, and select-fewer messaging

## 5. Verification

- [x] 5.1 Manual check: a single highlight produces full-article context with the highlight framed as user intent
- [x] 5.2 Manual check: several highlights from one paper produce one deduped source
- [x] 5.3 Manual check: many large highlights trigger summarization while highlights survive; many large full-document pins instead prompt "select fewer items" (never summarized)
- [x] 5.4 Run the full test suite and fix regressions
