## Context

`ArticleViewAI` exposes three primary tabs today: Recipe, Chat, and Contact and references. Pins for the opened article are rendered outside the tab system via a `#pins-after` slot filled by `ArticleSidePanel` with a teal footer card listing kind badges and `user_note` text only.

Pin board entry paths pass `pins` into `ArticleSidePanel`; explorer search opens the same panel without `pins`, so explorer users never see saved pins in-article even though `DeliverableHeader` already loads the current project's pins into the shared `usePinsSupabase` store (`useState("human-pins-rows")`).

The pin board already renders rich pin bodies via `PinBodyRenderer` and supports note editing in `PinBoardCard` via `pinsApi.updatePin` — patterns we can reuse later but not in v1.

## Goals / Non-Goals

**Goals:**

- Move per-article pins into a dedicated primary tab labeled **"Your pins"**, after Contact and references.
- Show the tab only when `articlePins.length > 0`.
- Display a red count badge on the tab at all times (active or inactive).
- Render each pin with `PinBodyRenderer` plus optional `user_note`.
- Resolve pins inside `ArticleViewAI` with explorer parity (filter global store by document uid when no explicit prop).
- Keep public board working via optional `pins` prop override.
- Remove `#pins-after` slot and footer UI.

**Non-Goals:**

- In-tab note editing (structure component for future edit only).
- Loading pins on full-page `/articles/[id]` (no `DeliverableHeader` there).
- New API routes or Supabase queries.
- Changing pin capture flows or `PinCaptureDialog`.
- Removing `:pins` from `PinBoardView` (redundant but harmless).

## Decisions

### 1. Pins live as a fourth primary tab inside `ArticleViewAI`

**Choice:** Extend `PrimaryId` with `"pins"` and add a `role="tabpanel"` sibling to recipe/chat/contacts.

**Rationale:** Matches user mental model; reuses existing scroll container pattern from the contacts tab; eliminates footer stealing height from recipe.

**Alternative considered:** Right-hand rail panel — rejected; primary nav already established and contacts tab proves full-width panel works.

### 2. `ArticlePinsSection.vue` as dedicated component

**Choice:** New file at `apps/web/app/components/explorer/article/ArticlePinsSection.vue`.

**Rationale:** Isolates list layout and future edit affordances; mirrors `SummaryContactsSection.vue` placement in `article/` folder.

**Props (v1):** `pins: HumanPinRow[]`. Emit hooks (`pin-updated`, `pin-deleted`) optional stubs for future editing.

**Per-pin row:** localized kind badge (`pins.kinds.*`), `PinBodyRenderer` with `body_kind` + `body.data`, `user_note` block when non-empty. Omit `source_title_snapshot` heading (all pins share the same article).

### 3. Pin resolution in `ArticleViewAI`

**Choice:**

```ts
const articlePins = computed(() => {
  if (props.pins?.length) return props.pins  // explicit override
  const uid = pinDocumentUid.value
  if (!uid) return []
  return pinsApi.pins.value.filter((p) => p.source_document_uid === uid)
})
```

**Rationale:** Zero `explorer.vue` changes; `DeliverableHeader` already populates the store on explorer/board/projects. `createPin` appends to the same store so new pins appear reactively. Public board keeps passing explicit `pins` from `usePublicBoard` (not in global store).

**Alternative considered:** Always require parent to pass pins — rejected; duplicates filter logic in every caller and misses explorer.

### 4. Conditional tab + badge in `ArticlePrimaryNav`

**Choice:** Extend nav item type with optional `badgeCount?: number`. When `badgeCount > 0`, render `UBadge` with `color="error"` and numeric label adjacent to tab text, including when tab is active.

**Rationale:** Minimal change to shared nav component; keeps badge logic declarative from `primaryItems` computed.

**Tab visibility:** Append pins item to `primaryItems` only when `articlePins.length > 0`.

**Edge case:** If user is on pins tab and last pin is deleted, reset `activePrimaryId` to `"recipe"`.

### 5. Remove `#pins-after` slot

**Choice:** Delete slot from `ArticleViewAI` template and remove `ArticleSidePanel` slot content. `ArticleSidePanel` may keep `pins?: HumanPinRow[]` prop and forward to `ArticleViewAI`, or callers can rely on store resolution — forwarding is kept for public board clarity.

### 6. i18n

**Choice:** Add `tabs.pins` = "Your pins" (EN), with ES/IT translations. Reuse existing `pins.kinds.*` and `pins.userNote` where applicable. Deprecate visual use of `pins.drawer.pinsInArticleHeader` in the footer (key may remain for other contexts).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Tab appears briefly after modal open while pins load | Acceptable; `DeliverableHeader` loads on mount. Tab pops in when store fills. |
| Public board regression if store-only resolution | Keep explicit `pins` prop path; `PinBoardView` continues passing `openedArticlePins`. |
| `PinBodyRenderer` client components (markmap) in modal | Same as pin board; already proven in drawer context. |
| Guest users never see tab | Correct — store empty when unauthenticated. |
| Full-page route shows tab if pins in memory | Harmless edge case; user accepted no dedicated full-page support. |

## Migration Plan

1. Ship `ArticlePinsSection` + nav badge + `ArticleViewAI` tab panel.
2. Remove footer slot usage from `ArticleSidePanel`.
3. Manual QA: pin board drawer, explorer modal with existing pins, pin creation in-article, public board drawer.
4. Rollback: revert component changes; no data migration.

## Open Questions

None — exploration session resolved label, badge behavior, renderer choice, and explorer parity.
