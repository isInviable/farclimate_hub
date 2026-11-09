# Design

## Context

See proposal.md for why. Today `about.vue` uses the default layout and renders `content/{en,es,it}/about.md` through Nuxt Content, with `AboutFigure` and `AboutSectorGrid` as the only markdown components. How-to, home, and skills already use the `site` layout (`SiteTopBar`, `SiteFooter`, `SiteNavOverlay`) and per-locale JSON data collections. The three photographs are already in `public/img/adaptarium/about/`. `gemas-aqua.png` has transparent edges and is meant to sit on the foam ground.

## Goals / Non-Goals

**Goals:**

- One structured content file per locale, rendered by a page component on the site layout.
- Remove the markdown about documents and the two components that exist only for them.

**Non-Goals:**

- Changing the footer, the navigation labels, or `header.about` (the default header still links with it).
- Adding a call to action, or matching the reference page's wide left inset and its blue `#015be6`.
- Changing ADAPTARIUM token values.

## Decisions

### JSON data collection, same shape as how-to

Replace the `about_*` page collections (`about.md`) with data collections sourced from `content/{en,es,it}/about.json`. `useAboutContent` follows `useHowToContent`: query the locale collection, fall back to English.

Alternative considered: keep markdown and add new MDC components for the bands. Rejected. The bands are a fixed layout with colored type, not prose, and the other redesigned pages already keep that kind of copy in JSON.

Schema, all strings required:

- `title`, `description` for the document title and meta description.
- `hero`: `kickerLines` (two strings), `wordLines` (TRANS, FOR, MA, TION), `hub`, `image`, `imageAlt`. The word lines and hub are identical in every locale.
- `answers`: three items `{ key, heading, body }` in order (is, is-not, want).
- `audience`: `heading`, `body`, `image`, `imageAlt`.
- `metaphor`: `solution`, `recipe`, `nameLines` (two strings), `body`, `image`, `imageAlt`.

Color and font are not content. The component paints `solution` with `text-adapt-orange`, `recipe` with `text-adapt-blue`, and `nameLines` with `font-adapt-title`.

### One stage component on the site layout

`about.vue` sets `layout: 'site'` and passes the document into `components/about/AboutStage.vue`. Register `~/components/about` in `nuxt.config.ts` the same way as `how-to`. The stage does not render a header or a footer; the layout already does.

Typography follows the reference roles already tokenized: Bebas (`font-adapt-keyword`) for the kicker and the paper headings, Archivo Black (`font-adapt-heavy`) for TRANSFORMATION and the first two yellow lines, Julius Sans One (`font-adapt-title`) for HUB and the sea-glass name, Actor (`font-adapt-body`) for paragraphs. Paper paragraphs use `text-adapt-ink-light` (`#666666`). The yellow paragraph and the black headings use `text-adapt-ink`.

Bands: `bg-adapt-foam`, `bg-adapt-paper`, `bg-adapt-yellow`. From `lg` (1024px) the hero is title-left / photo-right, the three answers are one row, the audience text sits left of `gemas-h.png`, and the metaphor photo sits left of the text. Below that, those regions stack in the order the spec names. The yellow heading is a short staircase: each line adds a start indent (`ml-0`, `ml-6`, `ml-12` or the equivalent). No button.

### Prerender with the other public pages

Add `/about`, `/es/about`, and `/it/about` to `routeRules` next to the how-to entries. The i18n strategy is `prefix_except_default`, so the locale paths need their own rules.

### Cleanup stops at this page

Delete `AboutFigure.vue`, `AboutSectorGrid.vue`, and the three `about.md` files in the same change as the JSON, so the markdown components are not left without a caller. Do not delete `header.about` or `SiteHeader`.

## Risks / Trade-offs

- [Reference blue `#015be6` versus token `#0f4fc4`] → Use `text-adapt-blue`. The rest of the site already does.
- [Sea-glass hero may show a seam on foam] → The file is transparent at the edges and its ground matches `#92c8b7`. Place it on `bg-adapt-foam` with no extra frame.
- [An unarchived change also deltas `site-navigation`, on "Top bar controls"] → This change only replaces "Existing header preserved elsewhere". The two deltas do not edit the same requirement.
- [English and Italian are translations, not a second source] → The wording is fixed in the about-page spec so implementation does not invent another pass.

## Migration Plan

Ship the JSON, the stage, the layout switch, the prerender rules, and the deletions together. The route stays `/about`. Rollback is reverting the change; there is no stored data to migrate.

## Open Questions

None.
