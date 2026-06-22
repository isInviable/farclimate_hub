# artifact-source-context Specification

## Purpose
TBD - created by archiving change improve-artifact-llm-context. Update Purpose after archive.
## Requirements
### Requirement: Selected pins are assembled into document-centric sources
The system SHALL provide a shared context-assembly module that converts selected pins into LLM source blocks grouped by `source_document_uid`. Pins sharing a `source_document_uid` MUST be merged into a single source that includes the parent article content once, with each contributing pin attached as a typed annotation. Pins without a `source_document_uid` MUST be emitted as standalone "loose" sources.

#### Scenario: Multiple fragments from one article are deduplicated
- **WHEN** the selection contains several pins (e.g. a full-document pin, two highlights, and an AI summary) that share the same `source_document_uid`
- **THEN** the assembled context MUST contain exactly one source block for that document
- **AND** the article's full text MUST appear only once in that block
- **AND** every contributing pin MUST be represented as an annotation within that block

#### Scenario: Loose pin without a parent document
- **WHEN** a selected pin has no `source_document_uid`
- **THEN** it MUST be emitted as its own standalone source block

### Requirement: Fragment sources receive full article context with user intent
The system SHALL load the full parent article text for any selected pin that has a `source_document_uid`, not only pins whose `body_kind` is `document`. Each fragment MUST be framed so the model is told it is the part of the article the user deliberately selected, while the surrounding article is provided as supporting context.

#### Scenario: Highlight expands to full article
- **WHEN** a `selected_text` pin with a `source_document_uid` is assembled
- **THEN** the source block MUST include the full article text
- **AND** the block MUST include the user's verbatim highlighted passage framed as the deliberately selected part
- **AND** any user note MUST be included as user intent

#### Scenario: Full-document pin
- **WHEN** a `document` pin is assembled
- **THEN** the source block MUST include the full article text framed as a primary source

### Requirement: Sources are labeled with provenance the model can act on
The assembled context SHALL label each piece of content with a provenance type and the prompt MUST include guidance on how to weight each type. Provenance MUST distinguish at least: primary source (full article), user highlight (deliberate selection), user note (explicit intent), derived synthesis (AI summary, grid-compare summary, mind map, chat answer), and visual asset (image).

#### Scenario: Derived synthesis is marked as non-primary
- **WHEN** an `ai_summary`, `grid_compare_summary`, `markmap`, or `chat_response` pin is assembled
- **THEN** its content MUST be labeled as derived synthesis
- **AND** the prompt guidance MUST instruct the model to use it for framing only and not as independent evidence

#### Scenario: User intent is prioritized
- **WHEN** a source includes user highlights or notes
- **THEN** the prompt guidance MUST instruct the model to prioritize those passages in the generated output
- **AND** the user-intent content MUST be ordered before the full article body within the source block

### Requirement: Excluded and format-specific pin kinds are filtered
The assembly module SHALL exclude `contact` and `website` pins from both formats. `image` pins MUST be available only to the PowerPoint flow as a visual asset and MUST NOT be included as text in the podcast flow.

#### Scenario: Contact and website pins are dropped
- **WHEN** the selection contains `contact` or `website` pins
- **THEN** they MUST NOT contribute text to either the presentation or podcast context

#### Scenario: Image pins are PowerPoint-only
- **WHEN** the selection contains `image` pins
- **THEN** they MUST be available as visual assets to the PowerPoint flow
- **AND** they MUST NOT be added as text sources to the podcast flow

### Requirement: Context is bounded by a token budget with graceful degradation
The assembly module SHALL enforce a configured context budget of approximately 500,000 character-equivalent (≈50% of the model window), estimating tokens as characters divided by four. When the assembled context exceeds the budget, the module MUST reduce the level of detail of fragment-backed sources rather than failing, and MUST NOT drop the user's verbatim highlights or notes.

Degradation MUST apply only to fragment-backed sources (those derived from `selected_text`, `text_segment`, or `recipe_section` pins), replacing their full article text with the article's database summary plus structured metadata while retaining the verbatim highlight. Full-document pins (where the user explicitly pinned the whole article) MUST NEVER be degraded to a summary. Degraded sources MUST be relabeled and MUST carry a note stating the full body was omitted. When a database summary is unavailable, the module MUST fall back to a shortened article excerpt or structured metadata so a degraded source is never empty. If the context still exceeds the budget after all fragment-backed sources have been reduced to summaries, the module MUST signal that the selection is too large rather than degrading full-document pins, so the caller can ask the user to select fewer items.

#### Scenario: Within budget keeps full text
- **WHEN** the assembled context is within the configured budget
- **THEN** every source MUST retain its ideal level of detail
- **AND** full-text sources MUST include the complete article text

#### Scenario: Over budget degrades fragment-backed sources only
- **WHEN** the assembled context exceeds the budget and fragment-backed sources are present
- **THEN** the module MUST replace those sources' full article text with the database summary plus structured metadata
- **AND** the verbatim highlights and notes MUST remain in the block
- **AND** the degraded block MUST indicate that the full text was omitted

#### Scenario: Full-document pins are never summarized
- **WHEN** the context is over budget and a source is a full-document pin
- **THEN** the module MUST keep that source's full article text
- **AND** the module MUST NOT substitute its summary

#### Scenario: Still over budget after summarizing fragments
- **WHEN** the context still exceeds the budget after every fragment-backed source has been reduced to a summary
- **THEN** the module MUST signal that the selection is too large
- **AND** it MUST NOT degrade full-document pins

#### Scenario: Missing summary falls back safely
- **WHEN** a source must be degraded but its database summary is empty
- **THEN** the module MUST substitute a shortened excerpt or structured metadata
- **AND** the degraded source MUST NOT be empty

### Requirement: Structured article metadata is always included
For every article-backed source, the assembly module SHALL include compact structured metadata (climate impacts, adaptation approaches, sectors, keywords) at every level of detail, including degraded levels.

#### Scenario: Metadata survives degradation
- **WHEN** a source is degraded to summary-only or highlights-only
- **THEN** the structured article metadata MUST still be present in the source block

