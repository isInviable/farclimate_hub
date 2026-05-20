## 1. List viewmode (`ViewModeListSimple`)

- [x] 1.1 Wrap each hit row’s pin surface with `ViewModeGridHitContext` (pass `hit.document` fields needed for `PinArticleContext`) or an equivalent `provide` block per hit.
- [x] 1.2 Replace `<Pin>` with `CapturableBlock` for the title line; set `title`, `payload` / `preview`, `chrome` as needed to match current layout; use `pin-kind` appropriate for title text (default `text_segment` unless product specifies otherwise).
- [x] 1.3 Remove unused props/imports related to the legacy `Pin` API (`pin-id`, `pin-type`, etc.) and verify `isPinned` / selection UX still makes sense with `usePinsSupabase`.

## 2. Instagram viewmode (`ViewModeInstagram`)

- [x] 2.1 Provide `PinArticleContext` per hit (same pattern as §1.1).
- [x] 2.2 Replace `<Pin>` around the bookmark icon with `CapturableBlock`, using `#pin` slot to keep the bookmark icon UI and correct `aria-label` / i18n.
- [x] 2.3 Ensure pin payload/preview for Instagram matches intent (e.g. document title + subtitle snippet in preview if useful).

## 3. Repo sweep and verification

- [x] 3.1 Grep `apps/web` for `<Pin`, `Pin.vue`, and legacy `ui/pin` references; fix any remaining call sites.
- [x] 3.2 Run `pnpm run build` (or `pnpm exec nuxt prepare` + build) in `apps/web`.
- [ ] 3.3 Manual smoke: explorer list + Instagram pin flow for a hit with `document_uid`; confirm pin appears on board with correct source link.
