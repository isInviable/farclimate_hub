# Tasks

## 1. Locale content

- [x] 1.1 Replace the `about_*` page collections in `apps/web/content.config.ts` with data collections sourced from `content/{en,es,it}/about.json`, using the schema in design.md (`title`, `description`, `hero`, three `answers`, `audience`, `metaphor`). Verify the old `about.md` page schema and `heroImage` fields are gone from that file.
- [x] 1.2 Write `apps/web/content/es/about.json`, `en/about.json`, and `it/about.json` with the strings in `specs/about-page/spec.md`. Images are `/img/adaptarium/about/gemas-aqua.png`, `gemas-h.png`, and `quienes-somos-metafora.png`, each with a localized alternative text. `wordLines` is TRANS, FOR, MA, TION and `hub` is HUB in every locale. Verify the Spanish file contains "¿QUÉ queremos?", "SOLUCIONES", and all three image paths, and that the English and Italian bodies match the spec scenarios.
- [x] 1.3 Point `useAboutContent` at the data collections, with the same locale query and English fallback as `useHowToContent`. Verify `pnpm typecheck` in `apps/web` passes.

## 2. About stage

- [x] 2.1 Register `~/components/about` in `apps/web/nuxt.config.ts` the same way as `how-to`, and add `AboutStage.vue`. Render the foam hero, paper band, and yellow band with the fonts and colors in design.md, the staircase indent on the yellow heading, and no button. At `lg` the hero is title-left / photo-right, the three answers are one row, the audience text is left of its photo, and the metaphor photo is left of its text. Below `lg` those regions stack in the spec order. Verify the template contains `bg-adapt-foam`, `bg-adapt-paper`, `bg-adapt-yellow`, `text-adapt-orange`, `text-adapt-blue`, and no `UButton` or link styled as a call to action.
- [x] 2.2 Render `AboutStage` from `apps/web/app/pages/about.vue` with `layout: 'site'`, and set the document title and description from `title` and `description`. Verify the page no longer uses `layout: 'default'` or `ContentRenderer`.
- [x] 2.3 Add prerender rules for `/about`, `/es/about`, and `/it/about` beside the how-to rules in `apps/web/nuxt.config.ts`. Verify those three paths are present.

## 3. Remove the old page

- [x] 3.1 Delete `apps/web/content/{en,es,it}/about.md`, `apps/web/app/components/content/AboutFigure.vue`, and `AboutSectorGrid.vue`. Verify a search of `apps/web` finds no `about-figure`, `about-sector-grid`, or `about.md` references. Verify `header.about` in the locale files and `SiteHeader.vue` are unchanged.

## 4. Check the page

- [x] 4.1 Open `/es/about` at 1280px. Verify the top bar, overlay, and footer match how-to, "Quiénes somos" is active in the overlay, the previous header is absent, and there is no call to action. Verify the kicker is "SOBRE" / "EL PROYECTO", TRANSFORMATION is stacked in orange, the three Spanish headings and "¿QUÉ queremos?" are present, "UNA SOLUCIÓN" is orange, "UNA RECETA" is blue and stepped right, and "VIDRIOS" / "MARINOS" step right again. Verify the page does not show "escalera de acción colectiva".
- [x] 4.2 Open `/about` and `/it/about` at 1280px. Verify the English kicker is "ABOUT" / "THE PROJECT" and the Italian kicker is "SUL" / "PROGETTO", TRANSFORMATION and HUB are unchanged, and the paper and yellow bodies match the spec. Verify each of the three photographs has alternative text.
- [x] 4.3 Open `/es/about` at 390px. Verify the title, hero photograph, three answers, audience text, small sea-glass cluster, metaphor photograph, and yellow text stack in that order with no horizontal overflow.
- [x] 4.4 Run `pnpm build` in `apps/web` and verify it emits prerendered HTML for `/about`, `/es/about`, and `/it/about` containing "Sobre el proyecto", "About the project", and "Sul progetto" respectively.

## Workflow follow-up

- Archive the change after review.
