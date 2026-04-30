## ADDED Requirements

### Requirement: Pinboard creates podcasts from selected pins

The pinboard action bar SHALL replace the dummy "Create podcast" behavior with a guided podcast creation wizard for the current selected pins. The wizard SHALL show selected items before generation, collect optional extra prompt instructions, collect a podcast title, call the existing podcast summary endpoint, allow the user to edit the returned script, and call the existing podcast text-to-speech endpoint to create a podcast artifact.

#### Scenario: User opens the podcast wizard

- **WHEN** an authenticated user has selected one or more pins on `/explorer/board` and chooses "Create podcast" from the board action bar
- **THEN** the application SHALL open a podcast creation wizard instead of the demo audio modal
- **AND** the first step SHALL list the selected pins that will be included

#### Scenario: Empty selection is blocked

- **WHEN** the user chooses "Create podcast" with no selected pins
- **THEN** the application SHALL prevent podcast generation and show an actionable validation message
- **AND** no podcast endpoint request SHALL be sent

#### Scenario: Selection exceeds frontend limits

- **WHEN** the selected pins exceed the configured selected-item limit or selected text-size limit
- **THEN** the wizard SHALL display a validation error that explains the exceeded limit
- **AND** the wizard SHALL keep the user on the review step without calling the summarize endpoint

#### Scenario: Summary generation returns editable script

- **WHEN** the user submits valid selected pins, extra instructions, and title from the wizard
- **THEN** the application SHALL call `POST /api/podcast-summarize` with structured selected source context and extra instructions
- **AND** the wizard SHALL show a loading state while the request is pending
- **AND** the returned script SHALL appear in an editable text area for user review

#### Scenario: Reviewed script creates podcast artifact

- **WHEN** the user clicks "Generate podcast" after reviewing the editable script
- **THEN** the application SHALL call `POST /api/podcast-text-to-speech` with the active project id, reviewed script, title, selected source pin ids, and relevant metadata
- **AND** the wizard SHALL tell the user that the audio will be available in the board Artifacts section after creation

### Requirement: Podcast wizard sends useful selected source context

The podcast wizard SHALL build selected source payloads from the loaded `human.pins` rows for the active board. Each selected source sent to the summarize endpoint MUST preserve source boundaries and include best-available pin context, including pin id, display title, body kind, source document uid, user note, and selected text or markdown extracted from the pin body.

#### Scenario: Selected pin context preserves source boundaries

- **WHEN** the user generates a summary from multiple selected pins
- **THEN** the summarize request SHALL include one source item per selected pin
- **AND** each source item SHALL include the pin id and available title, kind, source document uid, note, and text fields

#### Scenario: User instructions are passed to summarization

- **WHEN** the user enters extra podcast instructions in the wizard
- **THEN** the summarize request SHALL include those instructions as `extraInstructions`

### Requirement: Pinboard shows podcast artifacts

The board page SHALL include an Artifacts section with a Podcasts subsection. The Podcasts subsection SHALL be visible for authenticated users of the active project even when no podcast artifacts exist, and SHALL list available ready podcast artifacts with controls to listen and download when they are available.

#### Scenario: No podcasts available

- **WHEN** the authenticated user opens `/explorer/board` for a project with no podcast artifacts
- **THEN** the Artifacts section SHALL still show a Podcasts subsection
- **AND** the subsection SHALL display help text explaining that generated podcasts will appear there

#### Scenario: Podcasts are listed

- **WHEN** the active project has ready `human.artifacts` rows with `kind = 'podcast'`
- **THEN** the Podcasts subsection SHALL list those podcasts with their title or fallback label, creation metadata when available, and controls to listen and download

#### Scenario: Podcast list refreshes after generation

- **WHEN** the podcast text-to-speech endpoint returns a created podcast artifact
- **THEN** the board SHALL refresh or update the Podcasts subsection so the new artifact is available without requiring a full page reload

#### Scenario: Artifact access stays authenticated

- **WHEN** the user listens to or downloads a podcast artifact
- **THEN** the application SHALL use an authenticated private Storage access path for the artifact object
- **AND** it SHALL NOT rely on bundled demo media or public static podcast files
