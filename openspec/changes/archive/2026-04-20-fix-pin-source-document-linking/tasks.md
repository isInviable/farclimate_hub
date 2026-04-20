## 1. Article context injection key

- [x] 1.1 Create `apps/web/app/components/explorer/pinContext.ts` exporting `PinArticleContextKey: InjectionKey<PinArticleContext>` and the `PinArticleContext` interface (`documentUid: Ref<string | null>`, `title: Ref<string | null>`).
- [x] 1.2 In `apps/web/app/components/explorer/ArticleViewAI.vue`, `provide(PinArticleContextKey, { documentUid, title })` where the refs are `computed` from `props.document.document_uid` (fallback `props.document.id` if `document_uid` is absent) and `props.document.title`.

## 2. SelectableBlock consumes context

- [x] 2.1 Convert `apps/web/app/components/explorer/SelectableBlock.vue` from `<script setup>` (no TS) to `<script setup lang="ts">` and type its props.
- [x] 2.2 Add optional prop `pinKind?: 'text_segment' | 'contact' | 'website' | 'image'` with default `'text_segment'`.
- [x] 2.3 `inject(PinArticleContextKey, null)` in setup; derive `injectedUid` and `injectedTitle` (both may be `null`).
- [x] 2.4 Update `handlePin` to compose `sourceDocumentUid = injectedUid.value ?? null`, `title = [injectedTitle.value, props.label].filter(Boolean).join(' — ') || undefined`, and pass `bodyKind: props.pinKind` to `pinContent`.
- [x] 2.5 When `inject` returns `null`, keep current behaviour (no override, graceful degradation to "source missing").

## 3. Annotate article blocks with body_kind hints

- [x] 3.1 In `apps/web/app/components/explorer/ArticleSummaryView.vue`, set `pin-kind="contact"` on the "Contact persons" `SelectableBlock` and `pin-kind="website"` on the "Websites" `SelectableBlock`; leave other blocks on the default.
- [x] 3.2 Audit `apps/web/app/components/explorer/ArticleStructuredView.vue` for any `SelectableBlock` usage; apply the same `pin-kind` annotations where a clear `contact` / `website` match exists, otherwise leave default. — **No-op: that view renders recipe markdown via `UCard` + `v-html` and does not use `SelectableBlock`.**

## 4. i18n labels

- [x] 4.1 Ensure `apps/web/i18n/locales/en.json` `pins.kinds` has keys for `text_segment`, `contact`, `website`, `image`, `document`, `chat`, `unknown`. — **Already present; no change required.**
- [x] 4.2 Mirror the same keys in `apps/web/i18n/locales/es.json`. — **Already present; no change required.**

## 5. Tests

- [ ] 5.1 Add Vitest component test `apps/web/tests/components/SelectableBlock.pin.test.ts` that mounts `SelectableBlock` with `PinArticleContextKey` provided, stubs `usePin`, triggers the pin click, and asserts `pinContent` was called with `sourceDocumentUid`, `title` (containing both article title and block label), and `bodyKind`. — **Blocked: Vitest is configured with `environment: "node"` and the project has no `@vue/test-utils` / `jsdom` dep. Adding Vue component tests requires new devDeps and a split Vitest project config; deferred to a follow-up change.**
- [ ] 5.2 Add a second case to the same test file without `provide`, asserting `pinContent` is called with no overrides. — **Blocked with 5.1.**
- [x] 5.3 Extend `apps/web/tests/human/pinboards.rls.test.ts` only if a test fixture was built around `source_document_uid = null` for article blocks; otherwise leave as-is (no schema change). — **Not needed: no RLS / schema change and no existing fixture targets article-block pins.**

## 6. Manual verification

- [X] 6.1 Run `pnpm --filter web dev`, open an article, pin "Short description", "Sector", "Contact persons", and "Websites" blocks.
- [X] 6.2 Navigate to `/explorer/board`: the four new pins SHALL show the "Open in explorer" link (no "Source document is not linked" warning) and contact/website pins SHALL carry the matching badge.
- [X] 6.3 Pin an existing search-result row from the explorer list and confirm `Pin.vue` behaviour is unchanged.
- [] 6.4 Pin a `SelectableBlock` that lives outside an article context (if any) or synthesise one in a dev scratchpad; confirm the degraded "source missing" state still renders.

## 7. Wrap-up

- [ ] 7.1 Run `pnpm --filter web lint` and `pnpm --filter web test` and fix any fallout.
- [ ] 7.2 Update CHANGELOG or release notes if the project tracks them (skip if not applicable). — **No CHANGELOG in repo; skipped.**
- [] 7.3 Mark change ready for archive once PR is merged.
