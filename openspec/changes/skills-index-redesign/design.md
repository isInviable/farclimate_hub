# Design

## Context

See proposal.md for why the index changes. `/how-to` already uses `layout: 'site'`, which renders `SiteTopBar` in `bar` mode: the ADAPTARIUM wordmark, `SiteLocaleSwitcher`, `SiteSessionButton`, and the menu button, plus `SiteFooter` and `SiteNavOverlay`. The skills index uses `layout: 'default'` and `SkillsHero` under a transparent header.

Published skills already load through `fetchPublishedSkills()` in `useSkillsContent`. Each `SkillItem` has `title`, `description` (markdown before `<!-- more -->`), `url`, `image`, `date`, `readTime`, and `tags`. The query orders by `published_at` descending and falls back to English content.

Colors live in `@theme` in `apps/web/app/assets/css/main.css` and are used as utilities (`bg-adapt-ink`, `font-adapt-keyword`). The project styling rule is Tailwind utilities, not component CSS.

## Goals / Non-Goals

**Goals:**

- Render the training hero and catalog with the utilities those tokens generate.
- Keep one data call and one card component.
- Put the learn-more label in the template so English, Spanish, and Italian do not depend on a painted JPEG.

**Non-Goals:**

- Restyling `/skills/[slug]`. It stays on the default layout.
- Changing the skills query, storage bucket, or admin editor.
- Adding `habilidades.jpg` or `boton-saber-mas-8`.
- Collapsing the six new tokens into the main palette. That cleanup is later.

## Decisions

### Site layout, same header as how-to

The index sets `layout: 'site'`. That is the how-to header: wordmark, language switcher, session control, menu. No new header component.

Alternative: a skills-only bar. Rejected because the user asked for the how-to header, and the site layout already is that header.

### Catalog data stays on the existing query

`index.vue` keeps `useAsyncData('published-skills', () => fetchPublishedSkills(), { watch: [locale] })`. It drops `selectedTagSlugs`, `buildTagFilters`, and `filterOptions`. `SkillsFilterSidebar` is only referenced by the index, so it is deleted with the unused sidebar strings.

`SkillsGrid` receives the published list. `SkillCard` receives one `SkillItem` plus a `stoneSrc`. The grid sets `stoneSrc` to `boton-saber-mas-${(index % 7) + 1}.png` under `public/img/adaptarium/piedras_saber_mas/`. The card renders `item.title`, `item.description`, and a `NuxtLinkLocale` to `item.url`. The link contains the localized label and the stone image. `image`, `date`, `readTime`, and `tags` stay on the type for the detail page and are not rendered here.

Alternative: bake "SABER MÁS" into the JPEGs from the prototype. Rejected because those files are Spanish-only and the local PNGs already match the ink card (`#2c2c2c`).

### Hero copy is i18n, topics are not tags

New strings under `skills.index` in `en.json`, `es.json`, and `it.json`. Spanish is the prototype copy. English and Italian:

| Key | English | Italian |
|---|---|---|
| kicker | Training | Formazione |
| title | Online courses | Corsi online |
| lede | Reach relevant knowledge through online courses that help you face climate challenges and strengthen your project. | Avvicinati a conoscenze rilevanti con corsi online che ti aiutino ad affrontare le sfide climatiche e a rafforzare il tuo progetto. |
| topicsHeading | Courses and resources on topics such as: | Corsi e risorse su temi come: |
| topics | Agriculture, Life-cycle assessment, Biodiversity, Fisheries, Forestry, EU taxonomy | Agricoltura, Analisi del ciclo di vita, Biodiversità, Pesca, Selvicoltura, Tassonomia dell'UE |
| learnMore | Learn more | Scopri di più |

Spanish topics stay Agricultura, Análisis de ciclo de vida, Biodiversidad, Pesca, Silvicultura, Taxonomía de la UE. `learnMore` in Spanish is "Saber más". The empty-state description no longer mentions filters. Remove `sortMoreViews`, `sortRelevance`, and `skills.sidebar`.

The hero left column is `bg-adapt-yellow` with `habilidades.png` at the top (`object-contain`, not a stretched background). The PNG is a transparent strip, so the yellow field fills the column. The right column is `bg-adapt-skills-lagoon`. From `lg` the hero is a 2/3 + 1/3 grid; below that the columns stack.

### Tokens and utilities

Add these to `@theme` and use only the generated utilities:

| Token | Utility stem | Hex | Use |
|---|---|---|---|
| `--color-adapt-skills-pine` | `adapt-skills-pine` | `#04625d` | kicker |
| `--color-adapt-skills-lagoon` | `adapt-skills-lagoon` | `#27958a` | topic column |
| `--color-adapt-skills-sea` | `adapt-skills-sea` | `#37a697` | catalog band |
| `--color-adapt-skills-paper` | `adapt-skills-paper` | `#f8e9d9` | hero ground |
| `--color-adapt-skills-card` | `adapt-skills-card` | `#f7e9d9` | card titles |
| `--color-adapt-skills-rule` | `adapt-skills-rule` | `#fdbe0d` | rules between rows |

Ink cards use `bg-adapt-ink`. Center-column side rules use `border-adapt-aqua`. Title and lede use `text-black`. Type uses `font-adapt-heavy`, `font-adapt-title`, `font-adapt-keyword`, and `font-adapt-body`.

Layout uses standard utilities: `grid`, `flex`, `gap`, `px`, `py`, `lg:grid-cols-3`, `border-t`, `border-x`. No `<style>` block, no new class in `@layer components`, and no `bg-[#...]`.

From `lg`, the catalog is three columns. A card whose index is 3 or more gets `border-t` in `adapt-skills-rule`. A card whose index modulo 3 is 1 gets `border-x` in `adapt-aqua`. Below `lg` the catalog is one column and those rules are off, so stacked cards do not draw a vertical stripe.

### Empty state

Keep the existing alert when the list is empty. Update its description so it does not mention filters.

## Risks / Trade-offs

- [The PNG's yellow brush is not a flat `#fdbe0f`] → The column behind it is `bg-adapt-yellow`. A faint seam can show at the brush edge. Accept it until a full-field `habilidades.jpg` is added.
- [Six tokens sit one step away from sea, paper, and yellow] → Names start with `adapt-skills-` so a later cleanup can find them. Do not retint `adapt-sea`, `adapt-paper`, or `adapt-yellow` in this change.
- [The detail page stays on the old layout] → Leaving a card lands on the previous editorial page. Out of scope; the index link target stays `/skills/:slug`.
- [A skill with no `<!-- more -->` has an empty summary] → The card still shows the title and the learn-more link. The data layer already treats the summary that way.

## Migration Plan

Deploy with the web app. No data migration. Rollback is reverting the page, the three locale files, and the six tokens.

## Open Questions

None. The topic column is translated copy, the header is the how-to site bar, and the near-miss colors stay as their own tokens until a later cleanup.
