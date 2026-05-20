## Why

Users can already turn selected pinboard items into podcast content through a clear generation flow. We now need the same content-to-structure pattern for presentations, starting with a server-generated slide JSON structure that can later be rendered into PowerPoint with controlled PptxGenJS layouts.

## What Changes

- Add an authenticated server endpoint that accepts selected pinboard/content context plus optional generation instructions.
- Generate a presentation outline as validated JSON using a small, controlled slide schema.
- Support initial slide types for cover, title with bullet points, image with title, and title with image plus bullet points.
- Allow user instructions such as tone, language, audience, and requested slide count while enforcing a maximum of 10 slides.
- Preserve selected source boundaries in the LLM context and include source references in generated slide data for debugging only.
- Restrict image-based slide types to requests where selected content includes usable image sources.
- Keep PowerPoint file generation, template styling, PptxGenJS layout mapping, and UI changes out of scope for this change.

## Capabilities

### New Capabilities

- `presentation-structure-generation-api`: Authenticated API for generating validated presentation slide structures from selected pinboard context.

### Modified Capabilities

- None.

## Impact

- Adds a Nuxt server API endpoint for presentation structure generation.
- Adds shared validation/types for the presentation JSON schema.
- Adds LLM prompt/orchestration logic that follows existing server-only provider credential patterns.
- Adds automated tests for validation, prompt assembly, image gating, slide limits, and mocked LLM responses.
- Does not add new database schema, artifact storage, UI, or PowerPoint binary generation in this stage.
