## Context

The current article pinning UI is centered on `SelectableBlock.vue`. That component wraps many different kinds of content, which is valuable, but it also owns cosmetic block selection, hover state, pin UI, DOM-derived content extraction, and persistence. The block selection state is no longer a product feature, and future captures need to cover more surfaces than the current summary cards: selected article text, recipe sections, AI-generated summaries, chatbot responses, images, contacts, and references.

The existing pin data model already supports this direction. `human.pins` stores an open `body_kind`, a versioned JSON body envelope, logical source document fields, `user_note`, and sort order. The frontend spec already expects an extensible rendering registry and source-document propagation for article-hosted pins. This change should therefore be a frontend capture-flow redesign, not a database redesign.

## Goals / Non-Goals

**Goals:**

- Preserve the useful wrapper pattern for arbitrary rendered content.
- Remove block click-to-select behavior from article capture surfaces.
- Make pin creation explicit through a capture/pin control.
- Allow users to add an optional note while creating a pin.
- Store explicit structured payloads for known capture surfaces.
- Support selected-text capture anywhere inside supported article reading surfaces.
- Preserve article source context and valid location snapshots for all article-hosted captures.
- Keep existing pins rendering safely.

**Non-Goals:**

- Add database columns, RLS policies, or backend migrations.
- Implement image copy/storage orchestration beyond the existing `human-pin-storage` direction.
- Add collaborative pin editing, history, or annotation anchoring robust to article text changes.
- Make every visible block pinnable by default; capture remains opt-in for useful surfaces.

## Decisions

### Use a capture wrapper, not a selectable block

Introduce a successor abstraction, tentatively `CapturableBlock`, that wraps arbitrary content via its default slot and owns the default pin affordance. The wrapper MAY render its default pin control in a consistent position and SHALL expose a named `pin` slot for custom controls.

Alternatives considered:

- Keep `SelectableBlock` as-is and add notes. This preserves call sites but keeps misleading selection behavior and DOM scraping.
- Require each child component to render its own `PinButton`. This is flexible but makes adoption repetitive and easy to forget.

The wrapper-with-overridable-pin-control approach keeps the ergonomics that made `SelectableBlock` useful while separating capture behavior from selection.

### Capture payloads explicitly

Known capture surfaces SHALL pass `kind`, `title`, and `payload` to the capture flow. The capture composable SHALL persist that payload under `body.data` and MAY enrich it with article location when valid.

DOM-derived text MAY remain as a fallback for generic captures, but it SHALL NOT be the primary path for supported blocks. This prevents loss of structured data such as recipe section keys, image metadata, AI summary item structure, selected quote text, and chat message identifiers.

### Notes are part of the create flow

Pin creation SHALL open a lightweight capture dialog or popover that previews the content and includes an optional note field. Saving SHALL persist the note to `human.pins.user_note` in the same create operation.

This avoids a two-step "pin now, edit later" workflow for the user's core note-taking need. Existing board-level note editing remains useful for later changes.

### Text selection is separate from block capture

Selected-text capture SHALL be implemented as an article-level behavior attached to supported reading containers. It detects a non-empty selection within the article surface and offers a "pin selected text" action using the same note-capable capture flow.

This complements block capture:

- Text selection handles arbitrary quotes inside summary, structured, full-text, and future article views.
- Capturable blocks handle intentional units such as images, contacts, references, recipe sections, AI summaries, and chat responses.

### Keep backend storage unchanged

The existing `human.pins` shape is sufficient:

- `body_kind` stores the capture kind.
- `body.data` stores the structured payload.
- `source_document_uid` and `source_title_snapshot` store the logical source article.
- `user_note` stores the note.

New body kinds SHALL be handled in frontend mapping/rendering code and safe fallbacks. No schema migration is planned for this change.

## Risks / Trade-offs

- Captured text selection may not retain a stable anchor into the article after content changes → Store the selected quote, source article, and optional section/view metadata; do not promise durable highlight reattachment in this change.
- More explicit payloads require call sites to construct payloads carefully → Provide a small typed capture API and migrate high-value surfaces first.
- A default pin button inside a wrapper can conflict with complex child layouts → Provide the `pin` slot so children can place the capture control in their own actions area.
- New `body_kind` values may outpace pinboard card renderers → Keep unknown-kind fallback rendering and add explicit mappings for the kinds introduced by this change.
- Existing DOM-scraped pins may look different from newly structured pins → Preserve existing render paths and avoid data backfills.

## Migration Plan

1. Add the capture wrapper, capture dialog, and composable support for explicit payloads and notes.
2. Replace `SelectableBlock` usage in the article summary where pinning remains useful, or convert it into a compatibility wrapper without click-selection behavior.
3. Add selected-text capture to article-hosted reading containers.
4. Add curated capture wrappers to recipe sections and future-ready AI/chat surfaces where the payload is known.
5. Update pinboard render mappings for new `body_kind` values and verify unknown kinds still render safely.
6. Keep existing pins and existing board interactions unchanged.

Rollback is frontend-only: disable the new capture surfaces and retain existing pinboard rendering. No database rollback is required.

## Open Questions

- Which summary blocks should remain pinnable in the first implementation, beyond images, contacts, references, and recipe sections?
- Should text-selection capture be enabled on the chat transcript immediately, or only on article reading tabs first?
- Should the default capture dialog be a popover near the control/selection or a modal for consistency across desktop and mobile?
