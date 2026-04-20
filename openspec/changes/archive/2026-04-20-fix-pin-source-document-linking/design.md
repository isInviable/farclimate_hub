## Context

The pinboard feature (`human.pins` via `human-pins-frontend`) stores `source_document_uid` and `source_title_snapshot` so the board UI can render an "Open in explorer" deep link. Two pinning entry points exist today:

1. `apps/web/app/components/explorer/ui/pin/Pin.vue` — used by search-result rows (e.g. `ViewModeListSimple.vue`). It already receives `pinData.document_uid` and forwards `sourceDocumentUid`/`title` to `usePin.pinContent`.
2. `apps/web/app/components/explorer/SelectableBlock.vue` — used inside `ArticleSummaryView` (and potentially `ArticleStructuredView`) for every article sub-block (short description, sector, hazards, contact, website, keywords, geographic characterisation, etc.). It calls `pinContent(blockElement)` with **no overrides**, so the saved pin has `source_document_uid = null` and `source_title_snapshot = null`.

Symptom on the board (`/explorer/board`):

```vue
<p v-if="!pin.source_document_uid && (pin.body_kind === 'text_segment' || pin.body_kind === 'document')">
  {{ $t("pins.sourceMissing") }}
</p>
```

fires → "Source document is not linked; title and notes are still saved." shows for every block pin.

The article context is already in `ArticleViewAI` (`props.document` with `id`, `document_uid`, `title`). It just never reaches `SelectableBlock`.

## Goals / Non-Goals

**Goals:**

- Every pin created from content that belongs to a known article MUST carry `source_document_uid` and `source_title_snapshot` end-to-end, without consumers having to remember to pass them on every `<SelectableBlock>`.
- Keep `SelectableBlock`'s public API minimal — avoid adding 3 new props to every call site.
- Preserve the existing degraded "source missing" experience for genuinely orphan pins (e.g. arbitrary UI blocks outside article views).
- Give the board a clearer `body_kind` label for contact / website / map tiles so those pins don't all report as `text_segment`.

**Non-Goals:**

- No backfill of historical pins with null `source_document_uid`.
- No changes to Supabase schema, RLS, or server routes.
- No refactor of `Pin.vue` — it already works.
- Map / image pins remain `text_segment` (their block renders via `v-html`/`MapBase`, image pinning is out of scope per `human-pin-storage`).

## Decisions

### Decision 1: Use `provide` / `inject` for article context

Introduce a single injection key `PinArticleContextKey` that carries:

```ts
// apps/web/app/components/explorer/pinContext.ts
export interface PinArticleContext {
  documentUid: Ref<string | null>
  title: Ref<string | null>
}
export const PinArticleContextKey: InjectionKey<PinArticleContext> = Symbol('PinArticleContext')
```

- Provided once in `ArticleViewAI.vue` (top of `<script setup>`) using reactive refs computed from `props.document`.
- Consumed in `SelectableBlock.vue` via `inject(PinArticleContextKey, null)`.
- When `inject` returns `null`, `SelectableBlock` behaves exactly as today (no `sourceDocumentUid`, no title) — preserving the "source missing" fallback for non-article use sites.

**Alternatives considered:**

- Prop drilling through `ArticleSummaryView` / `ArticleStructuredView` → rejected: 10+ `<SelectableBlock>` call sites per view would each need two new props.
- Pinia store → overkill and harder to scope to "current article view".
- Global event bus → stateful coupling without type safety.

### Decision 2: `SelectableBlock` passes `label` as snapshot title suffix

`source_title_snapshot` currently carries the **article** title. For block pins we want the board card to display something more useful than the article title alone (e.g. "Short description", "Sector", "Contact persons"). We will compose:

```
source_title_snapshot = `${articleTitle} — ${block.label}`
```

when both are present, falling back to whichever is available. This keeps one field, doesn't require schema changes, and the board already renders `source_title_snapshot` as the card headline.

**Alternatives considered:**

- Storing label separately in `body.data.section_label` → useful later but not required for the fix.
- Using only `articleTitle` → loses block context, several cards on the board would look identical.

### Decision 3: Map block type → `body_kind`

`SelectableBlock` accepts an optional `pinKind` prop (default `'text_segment'`). Consumers pass `'contact'` for the contact persons block, `'website'` for the websites block, and leave the default for generic text blocks. This lets the board show meaningful badges (`pins.kinds.contact`, `pins.kinds.website`) and lets future renderers specialize.

- Default `text_segment` preserves today's behaviour for every existing `<SelectableBlock>` that isn't explicitly annotated.
- `bodyKind` override in `PinContentOverrides` already wins over the legacy `type`-based mapping in `usePin.bodyKindFromElement`, so no composable change is needed beyond plumbing.

### Decision 4: Keep `usePin.pinContent` signature stable

Add no new parameters. `SelectableBlock`'s `handlePin` reads the injected context and constructs a standard `PinContentOverrides` object. This minimizes blast radius and keeps `Pin.vue` untouched.

## Risks / Trade-offs

- **Risk**: A future article view forgets to `provide` the context → block pins silently regress to "source missing".
  **Mitigation**: Provide the key from `ArticleViewAI` (the only current host) and document it in the spec scenario. Add a Vitest that mounts `SelectableBlock` inside a wrapper that provides the key and asserts the `pinContent` call payload; add a second test without provide to assert graceful degradation.

- **Risk**: Block pins created today with `source_document_uid = null` will continue to show "source missing" even after the fix.
  **Mitigation**: Acceptable — we explicitly do not backfill. Users who re-pin the block will get a correctly linked pin.

- **Trade-off**: Concatenating `article.title — label` into `source_title_snapshot` mixes two logical fields into one. Acceptable for v1; if we later split them out we only touch the writers (this PR) and the board card.

- **Risk**: `document_uid` may be absent in `ArticleDetail` for very old rows.
  **Mitigation**: If `document_uid` is falsy, provide `null` and the current "source missing" degraded state still applies — identical to today's behaviour for orphan pins.

## Migration Plan

1. Land code changes in a single PR; no migration script needed.
2. Manually verify on `/explorer/board` that newly pinned blocks from any article tab (Summary, Structured) show an "Open in explorer" link and render the block label in the card headline.
3. Rollback is a straightforward revert — no data changes.

## Open Questions

- Should `ArticleStructuredView` (`apps/web/app/components/explorer/ArticleStructuredView.vue`) also be wired in this change, or does it not use `SelectableBlock`? → **Resolved during implementation**: the tasks step audits that file; if it uses `SelectableBlock`, it inherits the inject automatically (no extra work). If it has its own pin flow, a separate follow-up change is filed.
