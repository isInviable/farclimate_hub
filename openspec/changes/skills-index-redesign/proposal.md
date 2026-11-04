# Proposal

## Why

`/skills` still uses the old editorial index: a photo hero, a filter sidebar, and cover-image cards. The public site has moved to the ADAPTARIUM design, and the training section now has a yellow hero and a sea-glass catalog. The index should match that design while the courses themselves keep coming from published skills.

## What Changes

- Replace the skills index with the training layout: a two-column hero (glass photograph and a topic column) and a three-column catalog of ink cards on a sea band. Each card shows the skill title, the summary taken from the content before `<!-- more -->`, and a stone link.
- **BREAKING** The index no longer filters or sorts. Tag checkboxes, the "More views" and "Relevance" options, and the left sidebar leave this page. The detail page is unchanged.
- The catalog is not a static mock. It loads published skills with the existing `fetchPublishedSkills()` query, in the active locale, ordered by publication date descending. Each card links to that skill's detail URL. Stones cycle through `boton-saber-mas-1.png` through `boton-saber-mas-7.png`. The "learn more" label is HTML in the current locale, beside the stone, because the remote JPEGs have Spanish painted into the file.
- The hero topic column is fixed copy, translated in English, Spanish, and Italian. It lists Agricultura, Análisis de ciclo de vida, Biodiversidad, Pesca, Silvicultura, and Taxonomía de la UE. It does not read tags and it does not filter.
- The page uses the `site` layout, the same chrome as `/how-to`: the ADAPTARIUM wordmark, language switcher, session control, menu button, overlay, and footer. The transparent overlay header on the old hero goes away.
- Hero and topic strings replace the current index copy, which still tells people to use the left menu. Cover image, date, read time, and tag badges stay on the detail page and leave the index card.
- Six skills colors that are not the current ADAPTARIUM swatches are added as tokens so the page can use generated utilities. Existing token hexes stay. A later cleanup can fold the near-misses back into the main palette.
- The hero uses the existing `habilidades.png` on the yellow field. `boton-saber-mas-8` and the remote `habilidades.jpg` are not required.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `skills-page`: The index hero, sidebar, filters, and cover-image cards are replaced by the training hero, a static translated topic column, and a catalog of published skills. Detail pages and the Supabase data shape stay.
- `site-design-tokens`: The palette gains six skills-index colors. Existing ADAPTARIUM token values stay.

## Impact

- `apps/web/app/pages/skills/index.vue` switches to the `site` layout and drops filter state. `SkillsHero`, `SkillsGrid`, and `SkillCard` change. `SkillsFilterSidebar` is unused after this and can be removed.
- `apps/web/i18n/locales/{en,es,it}.json` replace the index hero and sidebar strings with the hero, topic column, and learn-more label. The empty state no longer tells people to adjust filters.
- `apps/web/app/assets/css/main.css` gains six color tokens inside `@theme`. Components use the generated utilities and standard Tailwind layout utilities. No new component classes and no arbitrary hex utilities.
- No API, schema, or storage changes. `fetchPublishedSkills()` and skill detail routes stay.
