## MODIFIED Requirements

### Requirement: PowerPoint wizard reviews selected context
The PowerPoint wizard SHALL provide a first step that displays selected item previews, selected item count, an estimated context size expressed as a token estimate, and generation instruction inputs. The wizard MUST load the full parent article text for any selected pin that has a `source_document_uid` (not only `document` pins) so that fragment context is available before generation. When the estimated context would exceed the configured token budget, the wizard MUST show a note that summaries are being used for fragment-backed sources rather than blocking generation. When the selection remains too large even after fragment-backed sources are summarized (e.g. many full-document pins), the wizard MUST keep the existing behavior of asking the user to select fewer items. Selection validation MUST remain consistent with the presentation structure endpoint for empty selections.

#### Scenario: Selected items are previewed
- **WHEN** the wizard opens with selected pinboard items
- **THEN** it MUST show each selected item title and a short text preview
- **AND** it MUST show context count and an estimated token size before generation

#### Scenario: Fragment pins load full article text
- **WHEN** the selection includes a pin that has a `source_document_uid` and is not a full-document pin
- **THEN** the wizard MUST fetch that document's full text for use as context
- **AND** the fetched article summary and structured metadata MUST be retained for degradation fallback

#### Scenario: Over-budget context shows a summaries note
- **WHEN** the estimated context size exceeds the configured token budget and fragment-backed sources can be summarized to fit
- **THEN** the wizard MUST show a note that summaries are being used for those sources
- **AND** it MUST still allow the user to proceed to generation

#### Scenario: Too large even after summaries asks to select fewer
- **WHEN** the selection still exceeds the budget after fragment-backed sources are summarized
- **THEN** the wizard MUST ask the user to select fewer items
- **AND** it MUST NOT proceed to generation until the selection fits

#### Scenario: User enters generation instructions
- **WHEN** the user enters tone, language, audience, slide count, or extra instructions
- **THEN** the wizard MUST include those instructions in the call to the presentation structure endpoint
