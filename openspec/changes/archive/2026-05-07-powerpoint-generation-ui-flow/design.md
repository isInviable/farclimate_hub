## Context

The pinboard board page already supports selected-item actions through `ActionBarBoard` and opens `PodcastCreationWizard` as a fullscreen modal. The podcast flow has the right interaction shape: review selected items, generate editable intermediate content, then create an artifact. The PowerPoint flow should follow that shape without reusing the podcast component directly, because the second and third steps differ: the reviewed intermediate state is structured slide JSON, and the final file is generated client-side with PptxGenJS.

The presentation structure endpoint already returns content-only slide data. This change adds the UI and artifact layer on top of that endpoint and introduces a deterministic client renderer. PptxGenJS supports browser usage, TypeScript, slide masters, wide layouts, and export formats including Blob/Buffer; this lets the browser build the `.pptx` after the user reviews the generated structure. PptxGenJS docs also show `defineSlideMaster()`, `addSlide({ masterName })`, `layout = "LAYOUT_WIDE"`, and presentation metadata as stable primitives for this stage.

## Goals / Non-Goals

**Goals:**

- Add a PowerPoint action to the selected pinboard item workflow.
- Build a new fullscreen PowerPoint wizard in separate components.
- Show selected item previews and collect generation instructions before calling the endpoint.
- Show the returned presentation JSON structure to the user before file generation.
- Persist the reviewed presentation structure as a `powerpoint` artifact metadata payload.
- Generate the `.pptx` client-side with PptxGenJS after structure review.
- Upload the generated `.pptx` to the private artifacts bucket and update/list it as a downloadable artifact.
- Implement one layout function per supported slide type.

**Non-Goals:**

- No new LLM endpoint or schema changes to the presentation structure endpoint.
- No server-side PPTX generation.
- No advanced template editor, theme designer, or arbitrary slide positioning.
- No support for unsupported slide types beyond the existing schema.
- No user-facing source citations unless added by a later change.

## Decisions

### Use a separate PowerPoint wizard component tree

Create a new `PowerPointCreationWizard.vue` and supporting child components/utilities instead of extending `PodcastCreationWizard.vue`. The sequence will be equivalent, but the state names, endpoint call, JSON review UI, artifact semantics, and client-side renderer are distinct.

Alternatives considered:

- Add branches inside the podcast wizard. This would couple audio generation and deck generation and make both flows harder to maintain.
- Create a generic “content generation wizard” abstraction now. The two flows are similar, but not yet stable enough to justify a shared abstraction.

### Replace the presentation action navigation with a modal open event

`ActionBarBoard` currently has a “Make presentation” select action that navigates to `/presentation`. This should emit an `open-powerpoint` or equivalent event so the board page opens the new wizard, matching the podcast modal pattern.

Alternatives considered:

- Keep navigation to a dedicated page. That breaks the selected pinboard workflow and loses the consistency users already have with podcast generation.

### Persist PowerPoint artifacts with structure metadata and PPTX Storage object

The artifact row should use `kind = 'powerpoint'`. The reviewed presentation structure should be stored in `metadata` so the app can inspect or later regenerate the deck. The generated `.pptx` should be uploaded to the existing private artifact bucket under the owner/project/artifact path convention and the artifact row should point at that object with the PowerPoint MIME type.

The likely implementation sequence is:

1. Call `POST /api/presentation-structure`.
2. Show/edit/review the returned JSON structure.
3. Create or prepare a `powerpoint` artifact row containing the reviewed structure metadata.
4. Build the `.pptx` client-side.
5. Upload the file to Storage and mark/update the artifact as ready.

Alternatives considered:

- Store only JSON and download a local `.pptx` without an artifact row. This would not satisfy the artifact requirement and would be inconsistent with podcasts/downloads.
- Upload the structure as a separate JSON file. Useful later, but metadata is enough for the reviewed structure in this stage.
- Generate server-side. The user explicitly wants step 3 client-side and PptxGenJS supports browser generation.

### Keep PptxGenJS layout functions deterministic

Implement a `buildPowerPointDeck(doc)` utility that creates a `pptxgen` instance, sets `LAYOUT_WIDE`, defines a base master, dispatches each slide to a `layouts` map, and returns the presentation object for export.

The layouts map must have one function per slide type:

- `cover`
- `bullets`
- `image-title`
- `image-bullets`

Each layout function owns fixed positions, typography, colors, placeholders, and image placement. It must not read layout fields from the LLM output. For images, the generator should resolve image source ids from the selected source data or artifact metadata and degrade safely if an image cannot be resolved.

Alternatives considered:

- Let the LLM emit PptxGenJS calls or layout coordinates. This would make deck output unpredictable and undermine the schema separation.
- Use HTML-to-PowerPoint conversion. The initial slide schema maps more cleanly to direct PptxGenJS calls.

### Keep artifact listing separate but integrated

Add a `usePowerPointArtifacts` composable or extend the artifact display with a PowerPoint section. The board’s artifact count should include PowerPoint artifacts, and users should be able to download ready `.pptx` files.

Alternatives considered:

- Hide generated PowerPoints after download. This would make PowerPoint generation less durable than podcasts and exports.

## Risks / Trade-offs

- Browser-side PPTX generation may fail for large decks or images -> Mitigation: keep the schema capped at 10 slides, validate selected context, and show safe errors before marking artifacts ready.
- Artifact metadata can grow if full slide structures are large -> Mitigation: store compact presentation JSON and avoid duplicating selected source full text in metadata.
- Client upload/update flow can leave pending/failed artifacts -> Mitigation: use explicit `pending`, `ready`, and `failed` states and update failure metadata when generation/upload fails.
- Image references may not map cleanly to browser-usable image data -> Mitigation: resolve only selected image sources and degrade with title/bullet content when image bytes cannot be embedded.
- PptxGenJS API details may vary by output method -> Mitigation: isolate all library calls in one generator utility and cover dispatch/export behavior with unit tests.

## Migration Plan

- No database schema migration is expected if `human.artifacts.kind` remains free text.
- If Storage policies already permit authenticated owner uploads under owner prefixes, reuse the existing artifact bucket.
- Rollback is UI-level: remove the PowerPoint action and wizard route integration; existing `powerpoint` artifact rows remain harmless metadata/file records.

## Open Questions

- Should the reviewed JSON structure be editable as raw JSON in this first UI, or read-only with only regeneration allowed?
- Should artifact creation happen before or after PPTX generation succeeds? The preferred behavior is pending-first for traceability, but ready-only avoids failed rows if client generation errors before upload.
