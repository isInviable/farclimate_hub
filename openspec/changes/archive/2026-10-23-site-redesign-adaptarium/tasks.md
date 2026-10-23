# Tasks

## 1. Design tokens

- [x] 1.1 Add `--color-adapt-{orange,blue,teal,brown,yellow,mist,sand,ink,aqua,paper}` and `--font-adapt-{title,heavy,keyword,body}` to the `@theme static` block in `apps/web/app/assets/css/main.css` without editing existing variables; verify with `git diff` that only additions appear in that file
- [x] 1.2 Add Julius Sans One, Archivo Black, Bebas Neue and Actor (weight 400) to `googleFonts.families` in `apps/web/nuxt.config.ts`; verify in `pnpm dev` that a test element with `font-adapt-keyword` renders "CLIMÁTICO" in Bebas Neue (DevTools > Computed > Rendered fonts)
- [x] 1.3 Verify explorer appearance is unchanged by comparing `/explorer/explorer` before and after in the browser (header, buttons, fonts)

## 2. Navigation model and i18n

- [x] 2.1 Create `apps/web/app/constants/siteNav.ts` with the six section items and the home item (`key`, `to`, `labelKey`, `bgClass`, `textClass`) in spec order; add `apps/web/tests/utils/siteNav.test.ts` asserting order, routes and colors; verify `pnpm vitest run tests/utils/siteNav.test.ts` passes
- [x] 2.2 Add `siteNav.*` keys (solutions, howTo, stories, training, network, about, home, open, close) to `i18n/locales/{en,es,it}.json` with the Spanish labels from the spec; verify `pnpm i18n:unused` does not report them once components exist and that labels render in all three locales
- [x] 2.3 Create `useSiteNav()` composable (items from the constant, `isActive(to)` using localized paths, shared `useState('site-nav-open')`); verify `pnpm typecheck` passes

## 3. Shared site components

- [x] 3.1 Register `~/components/site` in `nuxt.config.ts` `components` with `pathPrefix: false`; verify a component from that folder auto-imports
- [x] 3.2 Create `SiteLocaleSwitcher` (EN/ES/IT, active highlighted, uses `useSwitchLocalePath`) and `SiteSessionButton` (sign in with `returnTo`, or sign out, via `useAccess`); verify switching to IT keeps the same page and sign-in returns to the origin page
- [x] 3.3 Create `SiteNavOverlay` with `UModal` (square corners, home item + six bands in `font-adapt-keyword`, close button, active marking, closes on route change); verify open/navigate/Escape/Tab scenarios from the `site-navigation` spec in the browser
- [x] 3.4 Create `SiteTopBar` with `home` and `bar` modes (locale switcher, session button, hamburger toggling the shared state; small wordmark in `bar` mode); verify at 390px and 1280px widths
- [x] 3.5 Create `SiteNavVertical` (full-height column of six equal bands, lg+ only, active marking); verify it renders six bands filling the viewport height at 1280px
- [x] 3.6 Create `KeywordText` and `StoneCta` in `components/site/`; verify each renders correctly when placed on the home in task 5

## 4. Layouts

- [x] 4.1 Create `layouts/home.vue` (top bar home mode, slot, `SiteFooter`, `SiteNavOverlay`) and `layouts/site.vue` (top bar bar mode, slot, `SiteFooter`, `SiteNavOverlay`); verify that `about`, `stories`, `skills`, explorer and connected still render with `SiteHeader`

## 5. Home page

- [x] 5.1 Place design images in `apps/web/public/img/adaptarium/` (`home-gema.jpg`, `boton-9.png`, `fundamar-oscuro.jpg` delivered by the user; any further image is referenced by its intended path and copied when it 404s)
- [x] 5.2 Replace `homeSchema` in `content.config.ts` with the hero + stats schema from design.md and rewrite `content/{en,es,it}/home.json` (Spanish from the prototype, English and Italian translated); verify `pnpm build` succeeds with no content validation errors
- [x] 5.3 Create `HomeHero` (wordmark, tagline, sea-glass image on `bg-adapt-paper`, `KeywordText`, `StoneCta` to the explorer, `SiteNavVertical` at lg+) and `HomeStats` (`fundamar-oscuro.jpg` + overlapping blue block with yellow figures); verify against prototype screenshots at 1280px and 390px with no horizontal scroll
- [x] 5.4 Rewrite `pages/index.vue` with `layout: 'home'` rendering `HomeHero` and `HomeStats` only; verify the page shows hero, stats and footer in en/es/it
- [x] 5.5 Delete `HomeSectionHeading`, `HomeWhyMattersGrid`, `HomePlatformStep`, `HomeRecipeSection` (keep `HomeCard`); verify `rg` finds no references and `/explorer` (which uses `HomeCard`) still renders

## 6. How-to page

- [x] 6.1 Add `how_to_{en,es,it}` data collections and schema to `content.config.ts`, create `content/{en,es,it}/how-to.json` with provisional hero, seven steps (screenshots from `public/img/home/`) and CTA, and add `useHowToContent` with English fallback; verify `pnpm build` validates the content
- [x] 6.2 Create `pages/how-to.vue` with `layout: 'site'` (blue header band, alternating steps at lg+, stacked below, final `StoneCta`); verify the `how-to-page` spec scenarios in the browser in all three locales
- [x] 6.3 Add prerender `routeRules` for `/how-to`, `/es/how-to`, `/it/how-to`; verify `pnpm build` emits the three HTML files

## 7. Integration checks

- [x] 7.1 Run `pnpm lint`, `pnpm typecheck` and `pnpm test`; verify all pass with no new errors
- [x] 7.2 Run `pnpm build` and verify `/`, `/es`, `/it` and the three how-to routes are prerendered with their texts in the HTML
- [x] 7.3 Walk through home and how-to on desktop (1280px) and mobile (390px): vertical column, fixed hamburger, overlay, language switch, sign-in, and navigation to every section; verify explorer and connected headers are unchanged

## Workflow follow-up

- Replace provisional assets (SVG logo, transparent sea-glass PNGs, processed duotone photos) and provisional copy when the design team delivers them.
- Archive the change after review.
