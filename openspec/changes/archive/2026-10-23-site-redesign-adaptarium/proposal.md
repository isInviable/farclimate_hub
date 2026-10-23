# Proposal

## Why

The design team delivered a new visual identity for the public site (ADAPTARIUM Transformation Hub: sea-glass imagery, a 9-color palette, four new typefaces, and a color-coded section menu). The current home page and header use the older "editorial" FARCLIMATE look, and there is no page explaining how to use the solutions database. This change lands the identity foundations and the first visible pieces in a lightweight way, without disturbing the explorer and connected areas that still rely on the existing tokens.

## What Changes

- Add the ADAPTARIUM palette and typefaces as **new, namespaced** design tokens (`adapt-*` colors, `font-adapt-*` families). Existing tokens (`primary`, `neutral`, `trust-blue`, `--font-sans`, `--font-mono`, `--font-display`, editorial variants) remain unchanged.
- Introduce a shared site navigation model (six color-coded sections plus "Back to home") with three presentations:
  - **Vertical**: a full-height column of color bands inside the home hero (desktop).
  - **Overlay**: a modal of stacked color bands opened from a hamburger (below 1024px on the home, and on pages that do not show the vertical column).
  - **Horizontal**: reserved for a later change (rest of pages); only the data model is shaped to support it.
- Add a top bar with language switcher, sign-in/out, and hamburger for the new-style pages.
- Redesign the home page following the prototype's first two sections: hero (ADAPTARIUM wordmark, sea-glass column, keyword-highlighted intro, "Enter solutions" stone CTA) and stats band (100+ recipes, 41 countries, 7 bioregions over a duotone photo).
- **BREAKING (content)**: remove the current home sections (inspiration/sectors, why this matters, how the platform works, recipe) and their home-only components; the `home` content schema is replaced by the new hero + stats schema in en/es/it.
- Add a new `/how-to` page ("How to use the solutions") with a 7-step guide built from Nuxt Content, using provisional texts and existing platform screenshots until the design team's texts arrive.
- Rename the last menu entry to "About us" / "Quiénes somos" / "Chi siamo" in the new navigation only.

Provisional solutions (to be replaced when assets arrive): the ADAPTARIUM wordmark is set in type instead of an SVG logo; the hero sea-glass column is a JPG with a beige background placed on a matching `adapt-paper` background.

Image convention: all design images live in `apps/web/public/img/adaptarium/` and are referenced from content files as `/img/adaptarium/<name>`. Images not yet delivered are referenced by their intended path anyway; a 404 in development signals which file must be copied there.

## Capabilities

### New Capabilities
- `site-design-tokens`: ADAPTARIUM color and typography tokens available to the public site, isolated from the existing app tokens.
- `site-navigation`: color-coded section navigation shared by the public site (vertical, overlay, and future horizontal presentations), plus the top bar with language and session controls.
- `home-page`: content and layout of the public home page (hero and stats sections), sourced from Nuxt Content per locale.
- `how-to-page`: the "How to use the solutions" page with a step-by-step guide sourced from Nuxt Content per locale.

### Modified Capabilities
<!-- None: no existing spec covers the home page, the public header, or design tokens. -->

## Impact

- **Code**: `apps/web/app/assets/css/main.css` (new tokens only), `apps/web/nuxt.config.ts` (fonts, prerender for `/how-to`), new layouts `home` and `site`, new components under `app/components/site/`, `app/pages/index.vue` rewritten, new `app/pages/how-to.vue`, `content.config.ts` (home schema replaced, how-to collections added), `useHomeContent` composable, i18n locale files (new `siteNav` keys).
- **Content**: `content/{en,es,it}/home.json` rewritten; new `content/{en,es,it}/how-to.json`.
- **Removed**: `HomeSectionHeading`, `HomeWhyMattersGrid`, `HomePlatformStep`, `HomeRecipeSection` (only used by the home). `HomeCard` stays because `explorer/index.vue` uses it.
- **Assets**: `public/img/adaptarium/` already holds `home-gema.jpg` (hero sea-glass column), `boton-9.png` (transparent CTA stone) and `fundamar-oscuro.jpg` (processed stats photo); existing `public/img/home/*.jpg` screenshots reused for how-to.
- **Unaffected**: explorer, connected, admin, article layouts and `SiteHeader`; `about`, `stories`, `skills` keep the `default` layout for now.
- **Dependencies**: none new (Google Fonts via the existing `@nuxtjs/google-fonts`; overlay via Nuxt UI `UModal`).
