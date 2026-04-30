## 1. Types and payload builders

- [x] 1.1 Add `"document"` to `PinCaptureBodyKind` in `apps/web/app/types/pinCapture.ts` (remove reliance on `(string & {})` alone for this kind in call sites).
- [x] 1.2 Extend `buildPinCapturePayload` / related helpers so `bodyKind: "document"` produces a valid `human.pins` insert shape (`body_kind`, `body.v`, `body.data` minimal if allowed, `source_document_uid`, `source_title_snapshot`, `user_note`).
- [x] 1.3 Confirm Supabase insert path accepts `body_kind` `document` (no DB check constraint); adjust if needed.

## 2. Write paths: search and document views

- [x] 2.1 Refactor explorer **search hit** pin action to call `pinCapture` with `bodyKind: "document"` and explicit metadata; remove `pinContent` usage for that path.
- [x] 2.2 Add **Pin document** (or equivalent) to **document preview** layout wired to the same payload as 2.1.
- [x] 2.3 Add the same control to **full article** layout; ensure both paths set `source_document_uid` and title snapshot consistently.

## 3. Document vs fragment: helpers and UX

- [x] 3.1 Update `isDocumentPinned` (or add `isFullDocumentPinned` and migrate) so “whole document pinned” means `body_kind === "document"` plus matching `source_document_uid`; audit all callers (`explorer.vue`, headers, rows, etc.).
- [x] 3.2 If `findPinIdByDocumentUid` is used for replace/remove flows, decide whether it targets the `document` pin only or any pin; align with product and document in code comments only where behavior is non-obvious.

## 4. Board list and rendering

- [x] 4.1 Add **full papers** filter (or category) to `BoardList.vue` (or successor) keyed on `body_kind === "document"`; keep default “all pins” behavior.
- [x] 4.2 Register `document` in the pin card renderer path (`PinBoardCard` / registry) with sensible preview (title + open document + note; minimal body).
- [x] 4.3 Add i18n entries: `pins.kinds.document` and filter label copy; verify `mapBodyKindToBoardType` still maps `document` appropriately for sidebar `type` if unchanged.

## 5. Tests and verification

- [x] 5.1 Add or extend unit tests for `buildPinCapturePayload` / board mapping for `document` pins (mirror `apps/web/tests/pins/pinCapturePayload.test.ts` patterns).
- [x] 5.2 Manual QA: pin from search, pin from preview, pin from full article, confirm fragment pin still uses fragment kind; confirm filter lists only `document` rows.
