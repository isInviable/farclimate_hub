## Context

The Nuxt explorer pins whole documents from search and article surfaces using the same fragment-oriented kinds (`text_segment`, etc.) as paragraph-level captures, because the DOM-based **`pinContent`** path wraps hit rows or blocks without a dedicated envelope. The codebase already maps **`document`** to board type `"result"` in `mapBodyKindToBoardType` (`usePinsSupabase.ts`), but **`PinCaptureBodyKind`** does not list `"document"` and write paths do not consistently emit it. **`isDocumentPinned`** today returns true if **any** pin shares `source_document_uid`, which conflates “whole paper saved” with “any excerpt from this paper.”

## Goals / Non-Goals

**Goals:**

- Persist **`body_kind: "document"`** only for whole-document pins with required **`source_document_uid`** and **`user_note`** per product (body envelope may be minimal `{ v: 1, data: {} }` or a small stable shape if the insert layer requires non-empty `data`).
- Route **search-hit pin** and **Pin document** (preview + full article) through **`pinCapture`** with `bodyKind: "document"` and explicit title/metadata—not **`pinContent`** for those entry points.
- Expose a **board list filter** (or category) for full papers.
- Split **“has full-paper pin”** from **“has any pin referencing this document”** in UI logic where it affects duplicate prevention or affordance state.

**Non-Goals:**

- Migrating or rewriting historical rows.
- Deduplicating multiple `document` pins per `source_document_uid`.
- Changing fragment kinds (`text_segment`, `selected_text`, `section`, `recipe_section`, `markmap`, etc.) or forbidding both a `document` pin and fragments for the same document.

## Decisions

1. **`document` is capture-only for listed write paths**  
   Only search-hit pin and explicit “Pin document” actions insert `body_kind: "document"`. Other surfaces keep their existing kinds. Rationale: single source of truth for semantics; avoids reclassifying legacy DOM captures.

2. **Minimal `body.data` for `document`**  
   Prefer `{ }` or a single optional field (e.g. `pinned_as: "full_document"`) if validation requires a key; avoid duplicating full article HTML in the pin body. Title continues to live in **`source_title_snapshot`** per existing pins.

3. **`isDocumentPinned` → full-paper only**  
   Redefine (or add `isFullDocumentPinned` and migrate call sites) so “document row pinned” checks `body_kind === "document"` **and** matching `source_document_uid`. Call sites that need “any excerpt exists” use a separate helper or inline filter. Rationale: matches product distinction and avoids hiding “Pin document” after user pinned one paragraph.

4. **Search uses `pinCapture`, not `pinContent`**  
   Refactor the search result row pin handler to build a `PinCaptureRequest` with `bodyKind: "document"`, `sourceDocumentUid`, `title` from the hit, and optional `notes`. Rationale: aligns with user requirement and reduces DOM coupling.

5. **Board list type**  
   Keep **`mapBodyKindToBoardType`** mapping `document` → `"result"` unless the sidebar needs a distinct `type` for styling; the **new filter** is keyed on `body_kind === "document"` regardless. Rationale: minimal churn to `BoardListPinnedItem`; filter is authoritative for “full papers.”

## Risks / Trade-offs

- **[Risk] Call sites assume old `isDocumentPinned` semantics** → Mitigation: grep for `isDocumentPinned` / `findPinIdByDocumentUid` and update each (e.g. search row icon vs fragment flows).
- **[Risk] Empty `body.data` rejected by client validation** → Mitigation: align `buildPinCapturePayload` / insert validation with a documented minimal shape in tasks.
- **[Trade-off] Same document can have many `document` pins** → Accepted per requirements; UI may still show multiple cards.

## Migration Plan

None. Deploy frontend changes; old pins unchanged.

## Open Questions

- Exact **i18n keys** for the full-paper filter and `pins.kinds.document` (implementation choice).
- Whether **“Pin document”** should be disabled when a `document` pin already exists (product optional; spec can stay silent if both pins allowed).
