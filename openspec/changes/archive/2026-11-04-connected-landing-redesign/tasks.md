# Tasks

## 1. Palette tokens and shard image

- [x] 1.1 Add `--color-adapt-connected-hero: #1d418f`, `--color-adapt-connected-mint: #8dc7b8`, `--color-adapt-connected-figure: #005ae6`, and `--color-adapt-connected-paper: #f8e9d9` to the ADAPTARIUM block in `apps/web/app/assets/css/main.css`. Verify those four variables are present and that blue `#0f4fc4`, aqua `#85cec4`, foam `#92c8b7`, and paper `#f8e8d9` are unchanged.
- [x] 1.2 Save `https://sindicatoaudiovisual.com/wp-content/uploads/2026/08/gemas-connected.png` as `apps/web/public/img/adaptarium/gemas-connected.png`. Verify the file exists and is wider than 1000px.

## 2. Landing copy

- [x] 2.1 In `apps/web/i18n/locales/{en,es,it}.json`, under `connected.index`, add the kicker, title, and ways lines from design.md. Keep `heroIntro`, the stat labels, and the four card texts. Remove `eyebrow`, `heroTitle`, `cardsHeading`, `helpTitle`, and `helpBody`. Verify Spanish kicker plus title read "Explora el ecosistema de la" and "Misión de Adaptación Climática de la UE", Spanish ways reads "formas a explorar", English ways reads "ways to explore", Italian ways reads "modi per esplorare", and none of the three files still contain `connected.index.helpTitle`.

## 3. Visualization chrome

- [x] 3.1 In `apps/web/app/layouts/connected.vue`, replace `SiteHeader` with `SiteTopBar` in `bar` mode and mount `SiteNavOverlay`. Keep `ConnectedHeader` directly under the top bar and keep `SiteFooter`. Verify the template no longer references `SiteHeader`. Open `/connected/dashboard` at 1280px and confirm the ADAPTARIUM bar is above the tab bar, the tab bar still lists the visualization links, and the old FARCLIMATE header is gone.

## 4. Connected index

- [x] 4.1 Rebuild `apps/web/app/pages/connected/index.vue` on `layout: 'site'` as the three bands in design.md. Use `bg-adapt-connected-hero`, `bg-adapt-connected-mint`, `bg-adapt-connected-paper`, and `text-adapt-connected-figure`. Keep `useAsyncData("connected-overview-totals")` and the four `CaExploreCard` links. Do not render `CaHelp` or the prototype screenshot. Verify the page source sets the site layout, the lockup lines are CO, NNEC, TED, and ACTION, and the card targets are still `/connected/dashboard`, `/connected/EntitiesMap`, `/connected/PrjEntConnected`, and `/connected/ProjectsUmapNew`.
- [x] 4.2 In the browser at 1280px, verify the hero blue is `#1d418f` with the sea-glass photograph, the mint band is `#8dc7b8` with the localized heading, the introduction, the shard image, and four live figures, and the paper band is `#f8e9d9` with a blue 4 and the four cards. At 390px, verify those pieces stack in that order, the cards are one column, and there is no horizontal scroll.
- [x] 4.3 Open `/connected`, `/es/connected`, and `/it/connected`. Verify the lockup stays English on all three, each locale shows its own kicker, title, introduction, and ways label, and activating the entities map card opens that locale's map. Confirm the ways block has no help control.

## 5. Surrounding pages

- [x] 5.1 On `/connected/dashboard`, open the overlay and verify "Trabajo en red" is marked active, then confirm Escape closes it. Open the explorer and verify it still shows the previous header. On the connected index, confirm the footer is reachable below the cards.

## Workflow follow-up

- Archive the change after review.
