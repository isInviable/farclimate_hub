# Design

## Context

See proposal.md for why the index and the connected header change. `/how-to` uses `layout: 'site'`, which renders `SiteTopBar` in `bar` mode (ADAPTARIUM wordmark, language switcher, session control, menu button), `SiteFooter`, and `SiteNavOverlay`. The connected index and the four visualization pages use `layout: 'connected'`, which renders `SiteHeader`, then `ConnectedHeader` (the tab bar), then `SiteFooter`.

The index already loads project, entity, theme, and country counts in `useAsyncData("connected-overview-totals")` and renders four `CaExploreCard` links. Card copy and the introduction paragraph already exist under `connected.index` in `en.json`, `es.json`, and `it.json`.

Colors live in `@theme` in `apps/web/app/assets/css/main.css`. The styling rule is Tailwind utilities. `adapt-skills-*` is the existing pattern for a near-miss swatch that should stay findable for a later cleanup.

## Goals / Non-Goals

**Goals:**

- Put the landing on the how-to chrome and the four visualizations under that same top bar, with the tab bar kept beneath it.
- Paint the landing only with generated utilities, including the four new prefixed colors.
- Keep one count query and the existing card component.

**Non-Goals:**

- Restyling `CaExploreCard`, `CaPageHeader`, or the dashboard, map, network, and UMAP canvases.
- Changing the count query or the four routes.
- Translating the tab-bar labels in `connectedNav.ts`.
- Folding `adapt-connected-*` into the main palette.
- Changing the explorer, article, or admin header.

## Decisions

### Two layouts, one top bar

The index sets `layout: 'site'`. That is the how-to chrome, including the wordmark and the overlay links. It does not mount `ConnectedHeader`.

`layouts/connected.vue` replaces `SiteHeader` with `SiteTopBar` (`mode="bar"`) and mounts `SiteNavOverlay`. `ConnectedHeader` stays immediately under the top bar. Dashboard, `EntitiesMap`, `PrjEntConnected`, and `ProjectsUmapNew` already set `layout: 'connected'`, so they pick this up without a page edit. `useSiteNav` already treats `/connected` and its children as the networking item, so the overlay marks "Trabajo en red" active on the index and on a tool page.

Alternative: one new layout for every connected route. Rejected because the index must not show the tab bar, and `site` already has the footer and the overlay.

### Landing structure

One page, three bands, no duplicated mobile markup.

1. Hero. `bg-adapt-connected-hero`. The photograph is an `img` with `object-contain` centered, so the hero blue shows in any gap and matches the file. From `lg` the band is at least 46rem tall and the lockup sits in the right half, vertically centered. Below `lg` the band is about 12rem and the lockup stays readable over the glass. The lockup is hardcoded, the same way the top bar hardcodes ADAPTARIUM: three lines `CO`, `NNEC`, `TED` in `font-adapt-heavy`, then `ACTION` in `font-adapt-title`, all white.
2. Mint band. `bg-adapt-connected-mint`. From `lg`, three columns: kicker and title, right-aligned; introduction and the shard image; the four figures. Below `lg` those pieces stack in that order, which is the order the narrow-landing requirement names. Kicker is `font-adapt-keyword`, black. Title is `font-adapt-heavy`, white. Introduction is `font-adapt-body`, black. Each figure is `font-adapt-heavy text-adapt-connected-figure`; its label is `font-adapt-keyword uppercase text-white`.
3. Paper band. `bg-adapt-connected-paper`. The numeral `4` is `font-adapt-heavy text-adapt-connected-figure`. The ways label is `font-adapt-keyword uppercase`. The cards are the current grid and `CaExploreCard`, unchanged, so they stay links. The prototype's `connected-action-example.jpg` is a cropped picture of those cards and is not shipped.

The numeral is `cards.length`, not a translated word.

The shard image is saved from `https://sindicatoaudiovisual.com/wp-content/uploads/2026/08/gemas-connected.png` to `public/img/adaptarium/gemas-connected.png`. The 480px derivative is not used. Alternative text describes two pieces of sea glass.

### Copy

New keys under `connected.index` in all three locale files. The introduction and the four card texts stay. `helpTitle` and `helpBody` leave. The eyebrow is no longer rendered.

| Key | Spanish | English | Italian |
|---|---|---|---|
| kicker | Explora / el ecosistema de la | Explore / the ecosystem of the | Esplora / l'ecosistema della |
| title | Misión de Adaptación Climática / de la UE | EU Climate Adaptation / Mission | Missione UE per / l'adattamento climatico |
| ways | formas / a explorar | ways / to explore | modi / per esplorare |

Spanish `ways` keeps the prototype's "a". English and Italian keep the preposition already in "Four ways to explore" and "Quattro modi per esplorare". Stat labels stay as they are and are uppercased in CSS.

### Tokens

Add these to `@theme` and use only the generated utilities:

| Token | Utility stem | Hex | Use |
|---|---|---|---|
| `--color-adapt-connected-hero` | `adapt-connected-hero` | `#1d418f` | hero field |
| `--color-adapt-connected-mint` | `adapt-connected-mint` | `#8dc7b8` | introduction band |
| `--color-adapt-connected-figure` | `adapt-connected-figure` | `#005ae6` | counts and the numeral 4 |
| `--color-adapt-connected-paper` | `adapt-connected-paper` | `#f8e9d9` | ways band |

`#1d418f` is the corner color of `connected-action.jpg`. The prototype stylesheet said `#1d418e`; the file wins so a gap beside the photograph has no seam. Mint is not foam `#92c8b7` or aqua `#85cec4`. The paper ground is not `adapt-paper` `#f8e8d9`. Those four existing hexes stay.

White and black text use `text-white` and `text-black`. Layout uses `grid`, `flex`, `gap`, `px`, `py`, and `lg:grid-cols-3`. No `<style>` block, no new class in `@layer components`, and no `bg-[#...]`.

## Risks / Trade-offs

- [The cards keep the editorial type on the new paper band] → That is the block the prototype shows. Restyling `CaExploreCard` is a separate change.
- [A tool page now has the site bar and the tab bar] → The tab bar is the control the visualizations need. The old `SiteHeader` is the piece that leaves.
- [Opening a card swaps from the `site` layout to the `connected` layout] → Both render the same top bar, so the bar stays and the tab bar appears.
- [`skills-index-redesign` also appends tokens in `main.css`] → This change only adds the four `adapt-connected-*` lines. Do not edit the skills tokens or the existing hexes.
- [The shard file is only on the prototype server until it is committed] → The task copies it into `public/img/adaptarium/` before the page references it.

## Migration Plan

Deploy with the web app. No data migration. Rollback is reverting the index, the connected layout, the three locale files, the four tokens, and the shard image.
