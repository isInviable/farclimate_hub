## Context

The pinboard already supports body-kind section filtering and already includes a Full paper view. Users now need that existing Full paper view to distinguish full-paper pins from evidence that only sections/blocks were pinned. This should work in the same board UI used by `/explorer/board` and existing pinboard components, without changing pin storage.

## Goals / Non-Goals

**Goals:**
- Keep the same sidebar items/count in board view.
- Inside existing Full paper view, render two groups:
  - Group A: full pinned papers (`body_kind === "document"`).
  - Group B: papers that have fragment/content pins (`body_kind !== "document"`) grouped by `source_document_uid`.
- Keep all current filters/views operational and preserve current ordering expectations.
- Keep labels and empty states in i18n.

**Non-Goals:**
- No schema/API/RLS changes.
- No deduping/migration of existing rows.
- No changes to how pins are created in explorer/article flows.

## Decisions

1. **Reuse existing Full paper mode/state**
   Do not add new sidebar entries. Reuse the existing Full paper selection and adjust only its content rendering.

2. **Derive both groups from existing pin rows**
   - Full pinned papers group uses pin rows where `body_kind === "document"`.
   - Section/content-backed papers group is built from rows where `body_kind !== "document"` and `source_document_uid` is non-empty, grouped by `source_document_uid`.
   This keeps logic frontend-only and avoids backend work.

3. **Represent group B with a stable summary item**
   For grouped fragment-backed papers, derive one display item per `source_document_uid` using:
   - preferred title from first non-empty `source_title_snapshot`,
   - count of fragment pins in group,
   - optional representative card/open action tied to that document.
   This gives a paper-centric list while preserving pin detail access via existing flows.

4. **Keep existing sidebar and body-kind sections unchanged**
   Existing sidebar entries and section rendering remain intact; only Full paper internals are extended. This minimizes regression risk and makes rollback simple.

## Risks / Trade-offs

- **[Risk] Ambiguity for fragment pins without `source_document_uid`** → Mitigation: exclude these from group B and keep visible in existing body-kind/all views.
- **[Risk] Users may expect full-paper pins to be removed from All when grouped view exists** → Mitigation: specify Full paper as an additional view, not replacement.
- **[Trade-off] Group B summarizes paper-level entries instead of showing every fragment card** → accepted to satisfy paper-centric navigation objective.

## Migration Plan

No migration required. Deploy frontend-only changes and i18n strings.

## Open Questions

- In group B, should clicking an item open article side panel directly or switch to filtered pins list for that document?
- Preferred final copy for labels (e.g. “Full paper”, “Pinned papers”, “Papers with pinned sections”).
