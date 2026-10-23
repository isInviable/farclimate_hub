# Design

## Context

See proposal.md for motivation. Relevant current state in `apps/web`:

- Nuxt 4 + Nuxt UI v4 + Tailwind v4. Tokens live in `app/assets/css/main.css` (`@theme static` + `:root` Nuxt UI variables); Nuxt UI component variants live in `app/app.config.ts`. Fonts come from `@nuxtjs/google-fonts` in `nuxt.config.ts`.
- Every layout (`default`, `explorer`, `connected`, `article`) renders `SiteHeader` (`app/components/global/SiteHeader.vue`), which also owns the language switcher and sign-in/out logic (`useAccess`, `useSwitchLocalePath`).
- Home texts come from Nuxt Content data collections `home_{en,es,it}` (`content/<locale>/home.json`, Zod schema `homeSchema` in `content.config.ts`) via `useHomeContent`. The same composable file exports `useFooterContent`, used by `SiteFooter`.
- `HomeCard` is reused by `explorer/index.vue`; the other `components/home/*` are home-only.
- `/`, `/es`, `/it` are prerendered via `routeRules`.
- Design references: prototype at sindicatoaudiovisual.com/inviable, design manual (palette, fonts), and two screenshots (horizontal header for inner pages; mobile top bar + overlay menu).

## Goals / Non-Goals

**Goals:**
- One navigation data source that the vertical column, the overlay, and a future horizontal bar all render from.
- New design confined to two new layouts so no existing page changes appearance unless it opts in.
- Content editable in Nuxt Content without touching components.

**Non-Goals:**
- Horizontal header implementation and migration of `about`, `stories`, `skills`, `connected`, `explorer` to the new design.
- Footer redesign (the existing `SiteFooter` is rendered unchanged).
- Remaining prototype home sections (recipe diagram, "Inspírate" slider, stories CTA).
- Mobile "use a computer" pop-up for the solutions database.
- Final assets (SVG logo, transparent sea-glass PNGs, processed duotone photos) and final copy from the design team.

## Decisions

### 1. Namespaced tokens added alongside existing ones
Add `--color-adapt-{orange,blue,teal,brown,yellow,mist,sand,ink,aqua,paper}` and `--font-adapt-{title,heavy,keyword,body}` to the existing `@theme static` block; Tailwind v4 generates `bg-adapt-orange`, `font-adapt-keyword`, etc. Add the four families to `googleFonts.families`.
- *Alternative*: remap Nuxt UI `primary`/`neutral` to the new palette. Rejected: it would restyle explorer/connected immediately (user chose "static pages first").
- No new `@layer utilities` classes; components use Tailwind utilities directly, per project rules.

### 2. Navigation model in a composable, presentations as components
`useSiteNav()` returns `items: SiteNavItem[]` (`key`, `to`, `labelKey`, `bgClass`, `textClass`) plus `homeItem` and `isActive(to)`. Colors are stored as full Tailwind class strings (not built dynamically) so Tailwind can detect them.

Components in a new `app/components/site/` directory (registered with `pathPrefix: false` like the others):

```
useSiteNav() --+--> SiteNavVertical   (home hero, lg+)
               +--> SiteNavOverlay    (UModal; all breakpoints)
               +--> SiteNavHorizontal (future change)

SiteTopBar = SiteLocaleSwitcher + SiteSessionButton + hamburger
```

- `SiteLocaleSwitcher` and `SiteSessionButton` re-implement the small locale/session logic from `SiteHeader` instead of refactoring `SiteHeader`, to keep the existing header untouched in this change. Consolidation is a follow-up once the horizontal header replaces `SiteHeader`.
- Overlay state (`open`) is shared via `useState('site-nav-open')` so the hamburger in the top bar and the overlay in the layout stay decoupled.
- Overlay uses Nuxt UI `UModal` (focus trap, Escape, scroll lock) with `ui` overrides for square corners and no padding; it closes on `route.fullPath` change.
- New i18n keys under `siteNav.*` (solutions, howTo, stories, training, network, about, home, open, close) in `i18n/locales/{en,es,it}.json`. Existing `header.*` keys are untouched.

### 3. Two layouts: `home` and `site`
- `layouts/home.vue`: `SiteTopBar` in "home" mode (below lg: sticky bar on `adapt-paper` with the hamburger; lg+: locale + session absolutely positioned top-left over the hero, no hamburger because the vertical column is the menu), `<slot />`, `SiteFooter`, `SiteNavOverlay`.
- `layouts/site.vue`: `SiteTopBar` in "bar" mode at every breakpoint (small ADAPTARIUM wordmark linking home on the left), `<slot />`, `SiteFooter`, `SiteNavOverlay`. Used by `/how-to`; when the horizontal header lands it will render inside this layout at lg+.
- *Alternative*: a single layout switching on `route.meta`. Rejected: two small layouts are clearer and match how the app already separates layouts.

The vertical column is rendered by the hero section itself (it is part of the hero composition and scrolls with it), not by the layout.

### 4. Home content schema
Replace `homeSchema` with:

```ts
hero: {
  wordmark: string[]            // ["ADAP","TA","RI","UM"]
  tagline: string               // "TRANSFORMATION"
  taglineSecondary: string      // "HUB"
  image: string; imageAlt: string
  intro: { text: string; keyword?: boolean }[]
  cta: { label: string; to: string; image: string }
}
stats: {
  image: string; imageAlt: string
  items: { prefix?: string; value: string; label: string }[]
}
```

- Intro as an array of segments (rather than Markdown with inline markers) keeps each keyword a separate block, matching the prototype's line breaks, and stays trivially editable in JSON.
- `useHomeContent` keeps its signature; `useFooterContent` is unchanged.
- Spanish copy is taken from the prototype; English and Italian are translated from it.

### 5. Home components
In `app/components/home/` (new files, old home-only ones deleted):
- `HomeHero`: grid with wordmark (`font-adapt-heavy`, orange, one syllable per line) + tagline (`font-adapt-keyword` / `font-adapt-title`), sea-glass image, `KeywordText` intro, `StoneCta`; plus `SiteNavVertical` at lg+. Background `bg-adapt-paper` so the JPG's beige background blends in (measured `#f8e8d9`).
- `HomeStats`: the already-processed photo (`fundamar-oscuro.jpg`) as a full-width `object-cover` background with a blue block overlapping it on the left (`bg-adapt-blue`, values in `text-adapt-yellow` `font-adapt-heavy`, labels in `font-adapt-keyword`). Below lg the block sits under the photo instead of over it.

In `app/components/site/` (reusable across future pages):
- `KeywordText`: renders segments; keyword segments in `font-adapt-keyword` uppercase.
- `StoneCta`: `NuxtLinkLocale` with stone image + label in `font-adapt-heavy`.

No CSS duotone component: the design team delivers photos already processed with their PSD filters (see manual, "Filtro fotográfico"), so components render them as-is.

### 6. How-to page
- `pages/how-to.vue` with `layout: 'site'`; content from new data collections `how_to_{en,es,it}` (`content/<locale>/how-to.json`) via `useHowToContent` (same locale-fallback pattern as `useAboutContent`).
- Schema: `hero { title, intro }`, `steps[] { key, title, body, image, imageAlt }`, `cta { label, to }`. Step numbers derive from order.
- Header band `bg-adapt-blue`; steps alternate image side at lg+ with large step numbers in `font-adapt-heavy`; final `StoneCta` to the explorer.
- Provisional copy and existing screenshots in `public/img/home/`: search (`explorer.jpg`), compare (`compare.jpg`), group by bioregion (`grouped.jpg`), read the recipe (`recipe-screenshot.png`), chat with documents (`chat.jpg`), pin to a board (`board.jpg`), create presentations (`presentacion.jpg`).
- `routeRules`: add prerender for `/how-to`, `/es/how-to`, `/it/how-to`.

### 7. Assets
- All design images live in `public/img/adaptarium/` and are referenced only from content files (never hard-coded in components, except the overlay/top-bar wordmark which is typographic).
- Available: `home-gema.jpg` (451×1254, beige background), `boton-9.png` (329×260, transparent, teal glow), `fundamar-oscuro.jpg` (1080×490, processed).
- Images not yet delivered are referenced by their intended path (e.g. a transparent `home-gema.png` later); a 404 in development tells the user which file to copy. When a transparent version arrives, only the content path changes.
- Wordmark set in type until the SVG logo arrives.

## Risks / Trade-offs

- [Four extra Google Font families load on every page, including explorer] → Restrict weights to what is used (Archivo Black 400, Bebas Neue 400, Julius Sans One 400, Actor 400); revisit with per-layout loading if performance budgets suffer.
- [Locale/session logic duplicated between `SiteHeader` and new site components] → Accepted temporarily; tracked as a follow-up when the horizontal header replaces `SiteHeader`.
- [Content schema change breaks the prerender if any locale file is not migrated] → Migrate all three `home.json` files in the same task and run `nuxt build` to validate the Zod schemas.
- [Beige JPG background may not match exactly on some displays or after compression] → `adapt-paper` measured from the image; replace with transparent PNGs when available.
- [`boton-9.png` has a teal glow designed for the aqua background; on `adapt-paper` it reads as a halo] → Accepted for the hero CTA (matches the prototype's stone style); ask the design team for a variant without glow if it looks off.
- [`fundamar-oscuro.jpg` is only 1080px wide; it may look soft on wide or retina screens] → Acceptable for now; request a 2x export.
- [Provisional texts may be mistaken for final copy] → Mark how-to and en/it home texts as provisional in the PR description; final copy comes from the design team's "Textos" document.

## Migration Plan

Single deploy. Rollback = revert the commit (content files and components travel together). No database or API changes.
