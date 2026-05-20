## 1. Selection and Entry Point

- [x] 1.1 Update `ActionBarBoard` to emit a PowerPoint wizard open event for the presentation action instead of navigating to `/presentation`.
- [x] 1.2 Wire the board page to open the new PowerPoint wizard and include PowerPoint artifacts in the artifact count.
- [x] 1.3 Create PowerPoint-specific selection utilities for selected source previews, text sizing, image source preservation, and validation aligned with the presentation structure endpoint limits.
- [x] 1.4 Add i18n strings for the PowerPoint action, wizard steps, validation messages, and artifact labels.

## 2. PowerPoint Wizard Components

- [x] 2.1 Create `PowerPointCreationWizard.vue` as a separate fullscreen Nuxt UI modal with review, structure, generation, and complete states.
- [x] 2.2 Create child components for selected item review and generated slide structure preview so the wizard is not a monolithic copy of the podcast component.
- [x] 2.3 Implement instruction inputs for tone, language, audience, requested slide count, and extra instructions.
- [x] 2.4 Call `POST /api/presentation-structure` with selected sources and instructions, then show the returned structure before PPTX generation.
- [x] 2.5 Handle loading, cancel, back, retry, and safe error states without losing the selected item context.

## 3. Client-Side PPTX Generator

- [x] 3.1 Create a client-side PptxGenJS deck builder utility that sets `LAYOUT_WIDE`, presentation metadata, and a reusable base master.
- [x] 3.2 Implement one layout function per supported slide type: `cover`, `bullets`, `image-title`, and `image-bullets`.
- [x] 3.3 Ensure layout functions use application-controlled coordinates, typography, colors, and image placement rather than LLM-provided layout fields.
- [x] 3.4 Implement safe image resolution from selected source/image references and graceful fallback when an image cannot be embedded.
- [x] 3.5 Export the generated deck as a browser-uploadable `.pptx` Blob or equivalent supported output.

## 4. PowerPoint Artifact Persistence

- [x] 4.1 Add a PowerPoint artifact composable for listing `kind = 'powerpoint'` artifacts and creating signed download URLs.
- [x] 4.2 Implement artifact creation/update flow that stores reviewed presentation structure in metadata and source pin ids in `source_pin_ids`.
- [x] 4.3 Upload generated `.pptx` files to the private artifact bucket under owner/project/artifact object paths.
- [x] 4.4 Mark artifacts ready only after PPTX generation, upload, and metadata update succeed; record or surface failure states safely otherwise.
- [x] 4.5 Add a PowerPoint section to the board artifacts view with ready/pending/failed states and `.pptx` download.

## 5. Tests

- [x] 5.1 Add unit tests for PowerPoint selection utilities and validation messages.
- [x] 5.2 Add component or orchestration tests for wizard step transitions, endpoint request shape, structure preview, and error states.
- [x] 5.3 Add deck builder tests that mock PptxGenJS and verify each supported slide type dispatches to the matching layout function.
- [x] 5.4 Add artifact composable tests for listing, metadata shape, signed URL generation, and safe failure handling.

## 6. Verification

- [x] 6.1 Run targeted tests for PowerPoint selection, wizard orchestration, deck generation, and artifact composables.
- [x] 6.2 Run the relevant web app lint/type checks or document existing unrelated blockers.
- [x] 6.3 Manually verify the board flow: select items, open PowerPoint wizard, generate structure, review JSON, generate/upload `.pptx`, and download the artifact.
