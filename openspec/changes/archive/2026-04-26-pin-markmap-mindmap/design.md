## Context

`MarkmapViewer.client.vue` renders a mind map from YAML front matter plus markdown via `markmap-transform` (`transformer.transform`). It is used inside a fullscreen modal on `explorer.vue`, fed by `mindmapMarkdown` generated from the current explorer context (search / selection). Pins today use `CapturableBlock` on article surfaces and grid/chat modes; the mind map modal has no capture control yet. `human.pins` stores `body_kind` + JSON `body`; no DB migration is required for a new string `body_kind`.

## Goals / Non-Goals

**Goals:**

- Let authenticated users save the current mind map as a pin on the active project pinboard.
- Persist enough data to reproduce the same map in the pinboard and in any “open detail” flow (prefer **markdown + optional default YAML** over opaque markmap-runtime tree JSON for version stability).
- Populate `source_document_uid` and `source_title_snapshot` when the explorer has a clear parent document (e.g. `?document=` / side panel); otherwise allow null `source_document_uid` with a descriptive title (e.g. “Mind map · Explorer”) without breaking board rules.
- Register `markmap` (or chosen constant) in `usePinsSupabase`, `PinBodyRenderer`, `pinCapture` types, and i18n kind labels following `grid_compare_summary`.

**Non-Goals:**

- Editing pinned mind maps in place on the board (v1 is display + optional “open in explorer” when document is known).
- Server-side generation or storing binary screenshots as the primary payload.
- Replacing markdown generation with client-only markmap JSON unless we later prove markdown round-trips poorly.

## Decisions

1. **Payload shape** — Store `body.data.markdown` (string, required) and `body.data.yaml` (string, optional). Omit storing the internal markmap `root` tree unless we add a separate experimental field; markdown is the source of truth the viewer already uses.

2. **`body_kind` value** — Use `markmap` (short, matches component stack). Add to `PinCaptureBodyKind` union.

3. **Where to pin** — Primary UX: a **Pin** (or “Save to pinboard”) control in the mind map modal header in `explorer.vue`, next to Regenerate/Close, calling the same capture modal/composable used elsewhere (`usePinCapture` / existing flow). Optionally expose a secondary control from `MarkmapViewer` via slot or emit only if the parent needs tighter coupling; prefer parent-owned context (document uid, title, location snapshot).

4. **Rendering on the board** — Reuse `MarkmapViewer` inside pin detail or card preview with fixed height, `autoFit` tuned for cards, client-only boundary. If bundle size or SSR is a concern, lazy-load the client component (already `ClientOnly`-friendly).

5. **Location snapshot** — When pin is created from explorer and parent article location is available (same rules as other explorer-sourced pins), copy `body.data.location` if the codebase already resolves article location for explorer; if not trivial, defer to a follow-up and leave spec as SHOULD for document-scoped mind maps only.

## Risks / Trade-offs

- **[Risk] Large markdown** — Mind maps from big result sets may produce large `body` JSON → PostgREST payload limits / slow cards. **Mitigation:** Truncate preview on the card; full content in expandable detail; document max recommended size in tasks.

- **[Risk] No single document** — Aggregated mind map without `document_uid` → weaker “open in explorer”. **Mitigation:** Spec allows null `source_document_uid`; UI shows title-only and no broken deep link.

- **[Risk] Duplicate toolbar / interactions** — Embedded markmap in cards might fight scroll/zoom. **Mitigation:** Read-only presentation mode (hide Markmap toolbar on pin previews) or static SVG thumbnail in a later iteration; v1 can use compact viewer without toolbar duplication if we add a prop.

## Migration Plan

No database migration. Deploy frontend-only: new `body_kind` values appear as new rows; old clients show fallback until updated (already specified for unknown kinds).

## Open Questions

- Exact composer for `source_title_snapshot` when multiple hits contributed to the map (product copy).
- Whether to add `pin-kind` via `CapturableBlock` wrapping the modal body vs. a dedicated header button (implementation choice left to tasks).
