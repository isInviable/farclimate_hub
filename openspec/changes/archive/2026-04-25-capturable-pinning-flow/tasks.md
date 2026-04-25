## 1. Capture Core

- [x] 1.1 Define the frontend capture payload/types for block captures, selected-text captures, and optional notes.
- [x] 1.2 Update `usePin` or add a capture-focused composable so callers can create pins from explicit `body_kind`, `body.data`, source metadata, location, and `user_note`.
- [x] 1.3 Preserve the existing DOM-element pin path only as a fallback or compatibility path for legacy call sites.
- [x] 1.4 Add a reusable capture dialog/popover that previews the content, accepts an optional note, supports cancel/save, and reports saving/error state.

## 2. Capturable Block Wrapper

- [x] 2.1 Create `CapturableBlock` or refactor `SelectableBlock` into a successor that wraps arbitrary default-slot content without click-to-select behavior.
- [x] 2.2 Render a default capture control from the wrapper when capture is enabled.
- [x] 2.3 Add a named pin slot/API that lets complex children override the capture control while reusing the same capture flow.
- [x] 2.4 Ensure the wrapper uses article context from `PinArticleContextKey` to populate source document, title snapshot, and valid location.

## 3. Article Surface Migration

- [x] 3.1 Replace useful article summary pin targets with capturable blocks and explicit structured payloads.
- [x] 3.2 Remove cosmetic local selected state and click-to-select affordances from article block capture surfaces.
- [x] 3.3 Add curated capturable blocks for structured recipe sections using section key, title, markdown content, and source view metadata.
- [x] 3.4 Add or prepare capturable wrappers for AI summary and chat response surfaces where generated content payloads are available.

## 4. Selected Text Capture

- [x] 4.1 Add article-container text selection detection that ignores empty selections and selections outside supported article surfaces.
- [x] 4.2 Provide a selected-text capture action that opens the shared note-capable capture flow.
- [x] 4.3 Persist selected text captures with quote text, source view/section metadata when available, article source metadata, and valid location snapshot.
- [x] 4.4 Verify selected-text capture works across summary, structured, and full-text article reading surfaces where enabled.

## 5. Pinboard Rendering

- [x] 5.1 Add body-kind mappings and preview extraction for selected text, recipe section, AI summary, and chat response pins introduced by this change.
- [x] 5.2 Ensure unknown or unmapped body kinds still render through a safe fallback without breaking card menus, notes, source navigation, or map grouping.
- [x] 5.3 Confirm existing image, contact, website, and text-segment pins continue to render correctly.

## 6. Validation

- [x] 6.1 Add focused component/composable tests for explicit payload pin creation with and without notes.
- [x] 6.2 Add tests or manual verification for canceling the capture dialog without inserting a pin.
- [x] 6.3 Add tests or manual verification that block body clicks no longer toggle cosmetic selection.
- [x] 6.4 Run the relevant Nuxt/Vitest checks for the touched frontend files and fix introduced lint/type issues.
