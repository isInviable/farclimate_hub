## Why

Users can already generate podcasts from selected pinboard items through a clear modal flow. Now that the presentation structure endpoint exists, users need an equivalent PowerPoint workflow that turns selected items into a reviewable slide structure, stores it as a PowerPoint artifact, and generates a `.pptx` client-side.

## What Changes

- Add a new “generate PowerPoint presentation” action to the pinboard selection workflow instead of navigating away from the board.
- Add a new PowerPoint creation wizard in its own components, parallel to but separate from the podcast wizard.
- Step 1: show a modal window with selected pinboard items, context size, and generation instructions.
- Step 2: send selected items to the presentation structure endpoint, show the returned JSON structure to the user for review, and store that structure as a `powerpoint` artifact.
- Step 3: generate the `.pptx` client-side with PptxGenJS and one controlled layout function per slide type.
- Add PowerPoint artifact listing/download support alongside existing podcast and pinboard export artifacts.
- Keep slide rendering deterministic: layout functions own positions, typography, master slide usage, and PptxGenJS calls; the LLM-generated structure remains content-only.

## Capabilities

### New Capabilities

- `powerpoint-generation-ui`: Pinboard UI flow for generating, reviewing, storing, and downloading PowerPoint presentations from selected items.

### Modified Capabilities

- `human-artifacts`: Add `powerpoint` artifact semantics for presentation JSON metadata and generated `.pptx` Storage objects.

## Impact

- Adds new Nuxt/Vue components for the PowerPoint wizard and slide structure review.
- Updates the pinboard action bar and board page to open the PowerPoint wizard.
- Adds client-side PptxGenJS generator utilities with one layout function per supported slide type.
- Adds or extends artifact composables/views for `kind = 'powerpoint'`.
- Uses the existing `POST /api/presentation-structure` endpoint for structure generation.
- Uses private artifact Storage and `human.artifacts` rows for the generated PowerPoint file and reviewed structure metadata.
- Adds tests for selection validation, endpoint orchestration, artifact persistence, and slide layout dispatch.
