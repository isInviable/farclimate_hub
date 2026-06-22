# powerpoint-generation-ui Specification

## Purpose

Provide a pinboard-driven PowerPoint generation flow that reviews selected context, generates a structured presentation outline, and creates a downloadable `.pptx` artifact.
## Requirements
### Requirement: Pinboard action opens PowerPoint wizard
The pinboard selected-item action bar SHALL expose a PowerPoint generation action that opens a PowerPoint creation wizard without navigating away from the board. The PowerPoint wizard MUST be implemented in its own components and MUST NOT reuse the podcast wizard component as a branching implementation.

#### Scenario: User starts PowerPoint generation from selected items
- **WHEN** a user selects pinboard items and chooses the PowerPoint generation action
- **THEN** the board page MUST open the PowerPoint creation wizard
- **AND** the current pin selection MUST remain available to the wizard
- **AND** the app MUST NOT navigate to a separate presentation page for this flow

#### Scenario: No selection is handled safely
- **WHEN** the PowerPoint action is opened with no usable selected items
- **THEN** the wizard MUST show an empty or validation state
- **AND** it MUST NOT call the presentation structure endpoint

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

### Requirement: Wizard generates and displays presentation structure
The PowerPoint wizard SHALL call `POST /api/presentation-structure` with selected item sources and user instructions, then display the returned presentation JSON structure for user review before generating the PowerPoint file.

#### Scenario: Structure generation succeeds
- **WHEN** the presentation structure endpoint returns valid presentation JSON
- **THEN** the wizard MUST show the title and ordered slide structure to the user
- **AND** it MUST allow the user to proceed to PowerPoint generation

#### Scenario: Structure generation fails
- **WHEN** the presentation structure endpoint returns an error or the request fails
- **THEN** the wizard MUST show a safe error message
- **AND** it MUST allow the user to return to the review step without losing selected items

### Requirement: Reviewed structure is stored as a PowerPoint artifact
The PowerPoint wizard SHALL store the reviewed presentation structure as metadata for a `powerpoint` artifact. The stored structure MUST be the reviewed structure returned by the endpoint or user-approved in the UI, not a newly generated hidden structure.

#### Scenario: User approves generated structure
- **WHEN** the user proceeds after reviewing the generated structure
- **THEN** the system MUST create or update a `human.artifacts` row with `kind = 'powerpoint'`
- **AND** the artifact metadata MUST include the presentation title, slide structure, source count, generation timestamp or equivalent provenance, and any user instructions safe to store
- **AND** the artifact source pin ids MUST include the selected pin ids used for generation

#### Scenario: User cancels before approval
- **WHEN** the user closes the wizard before approving the generated structure
- **THEN** the system MUST NOT create a ready PowerPoint artifact

### Requirement: Client-side PptxGenJS generator uses controlled layouts
The application SHALL generate the `.pptx` client-side using PptxGenJS. The generator MUST define a deck builder that sets a wide presentation layout, defines reusable master or base styling, and dispatches each slide to one controlled layout function per supported slide type: `cover`, `bullets`, `image-title`, and `image-bullets`.

#### Scenario: Deck builder dispatches supported slide types
- **WHEN** the reviewed presentation structure contains supported slides
- **THEN** the deck builder MUST create one PowerPoint slide per structure slide
- **AND** it MUST call the matching layout function for each slide type

#### Scenario: Layout function owns presentation mechanics
- **WHEN** a layout function renders a slide
- **THEN** it MUST use fixed application-controlled PptxGenJS positions, text styles, and image placement
- **AND** it MUST NOT read x/y coordinates, fonts, colors, dimensions, or PptxGenJS options from LLM-generated data

#### Scenario: Unsupported slide type is encountered
- **WHEN** the generator receives a slide type that has no layout function
- **THEN** the generator MUST fail safely with a clear error
- **AND** it MUST NOT silently produce a corrupt or incomplete deck

### Requirement: PowerPoint file is uploaded and downloadable
After client-side generation succeeds, the application SHALL upload the generated `.pptx` file to the private artifact Storage bucket and mark the `powerpoint` artifact as ready. Ready PowerPoint artifacts MUST be listed in the board artifacts view and downloadable by the owner.

#### Scenario: PowerPoint generation completes
- **WHEN** the client successfully builds and uploads the `.pptx`
- **THEN** the artifact row MUST have `kind = 'powerpoint'`, `status = 'ready'`, the PowerPoint MIME type, byte size, bucket id, object path, and reviewed structure metadata
- **AND** the board artifacts view MUST include the ready PowerPoint artifact

#### Scenario: User downloads generated PowerPoint
- **WHEN** the owner clicks download for a ready PowerPoint artifact
- **THEN** the app MUST create a signed or authenticated download URL for the artifact object
- **AND** the downloaded filename SHOULD use the artifact title with a `.pptx` extension

#### Scenario: Generation or upload fails
- **WHEN** client-side deck generation or Storage upload fails
- **THEN** the wizard MUST show a safe error message
- **AND** the artifact MUST NOT be shown as ready unless the file upload and metadata update succeeded

### Requirement: PowerPoint generation UI is testable
The PowerPoint generation UI and utilities SHALL include automated tests for selection validation, endpoint request shape, structure review state, layout dispatch, artifact metadata shape, and error handling. PptxGenJS library calls MAY be mocked in unit tests.

#### Scenario: Tests cover wizard orchestration
- **WHEN** automated tests run
- **THEN** they MUST verify that selected items and instructions are sent to the presentation structure endpoint
- **AND** they MUST verify that generated structure is displayed before `.pptx` generation

#### Scenario: Tests cover layout dispatch
- **WHEN** deck builder tests run with a presentation structure containing each supported slide type
- **THEN** they MUST verify each slide type dispatches to its corresponding layout function

