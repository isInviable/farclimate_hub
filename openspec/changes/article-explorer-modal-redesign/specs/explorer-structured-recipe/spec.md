# Explorer structured recipe view (change delta)

Delta for capability `explorer-structured-recipe` under change `article-explorer-modal-redesign`.

---

## ADDED Requirements

### Requirement: Explorer modal recipe renders one canonical section per horizontal slide

When structured recipe content is rendered inside the **explorer blocking article modal** (capability `explorer-article-modal-layout`), the UI SHALL present **each visible canonical recipe section** (non-empty after trim, in the fixed key order defined in **Section ordering and visibility**) as **exactly one horizontal slide**. Subsection labels in the horizontal submenu SHALL correspond to those section titles. The UI SHALL provide explicit navigation via that submenu and previous/next controls as defined in `explorer-article-modal-layout`; swipe or drag SHALL NOT be required to change slides. Each slide's markdown body SHALL appear inside a **vertically scrollable** region when content overflows the modal body.

Markdown rendering, data loading (`/api/document-recipe` rules), and omission of empty keys SHALL remain as specified in the baseline **Structured tab uses database recipe only** and **Section ordering and visibility** requirements.

#### Scenario: Multiple non-empty sections in modal

- **WHEN** three canonical keys have non-empty bodies and the user views recipe inside the explorer blocking modal
- **THEN** the horizontal submenu SHALL expose three entries in the canonical order and the user SHALL be able to move among three slides using arrows without using swipe gestures

#### Scenario: Full-page structured tab

- **WHEN** the user views structured recipe in `ArticleViewAI` outside the explorer blocking modal
- **THEN** the UI MAY keep the existing vertical stacked card layout and is not required to use one-section-per-slide horizontal decks
