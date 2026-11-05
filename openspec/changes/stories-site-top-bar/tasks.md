# Tasks

## 1. Stories layout

- [x] 1.1 In `apps/web/app/layouts/stories.vue`, replace the fixed yellow button with `SiteTopBar` in `bar` mode. Keep `SiteFooter` and `SiteNavOverlay`, and keep the paper page background. Verify the template no longer contains the four yellow bars, and that `apps/web/app/pages/stories/index.vue` and `apps/web/app/pages/stories/[slug].vue` still set `layout: 'stories'`.

## 2. Browser check

- [x] 2.1 Open `/stories` and `/stories/water-smart-agriculture-extremadura` at 1280px and at 390px. Verify each page shows the ADAPTARIUM wordmark, EN / ES / IT, the session control, and the hamburger, with the poster or the article starting below the bar, and that the yellow four-bar button is gone.
- [x] 2.2 On a story article, open the menu and verify the stories item is marked active, then press Escape and verify the menu closes. Select IT on `/stories` and verify `/it/stories` opens with the same bar. Open `/explorer/` and verify it still shows the previous header.

## Workflow follow-up

- Archive the change after review.
