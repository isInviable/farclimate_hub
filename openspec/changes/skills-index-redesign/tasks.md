# Tasks

## 1. Color tokens

- [x] 1.1 Add `--color-adapt-skills-pine` `#04625d`, `--color-adapt-skills-lagoon` `#27958a`, `--color-adapt-skills-sea` `#37a697`, `--color-adapt-skills-paper` `#f8e9d9`, `--color-adapt-skills-card` `#f7e9d9`, and `--color-adapt-skills-rule` `#fdbe0d` to `@theme` in `apps/web/app/assets/css/main.css`. Leave the existing `--color-adapt-*` hexes unchanged. Verify the six names are present and orange, paper, and sea are still `#fc4b08`, `#f8e8d9`, and `#37a797`.

## 2. Copy

- [x] 2.1 Replace `skills.index` in `apps/web/i18n/locales/en.json`, `es.json`, and `it.json` with the kicker, title, lede, topic heading, six topics, and learn-more label from design.md. Spanish hero and topics stay the prototype wording. Update `skills.empty.description` so it does not mention filters. Remove `sortMoreViews`, `sortRelevance`, and `skills.sidebar` from the three locale files. Verify each locale has the six topics and that `rg` finds no remaining `skills.sidebar` or `sortMoreViews` references under `apps/web/app`.

## 3. Skills index

- [x] 3.1 Set `layout: 'site'` on `apps/web/app/pages/skills/index.vue` and keep `useAsyncData('published-skills', () => fetchPublishedSkills(), { watch: [locale] })`. Remove `selectedTagSlugs`, `buildTagFilters`, and `filterOptions`. Verify the page file no longer references `SkillsFilterSidebar`.
- [x] 3.2 Rewrite `SkillsHero` as the two-column hero: `habilidades.png` on `bg-adapt-yellow`, kicker in `text-adapt-skills-pine` and `font-adapt-heavy`, title in `font-adapt-title` and `text-black`, lede in `font-adapt-body`, topic column in `bg-adapt-skills-lagoon` with `font-adapt-keyword` topics. Use a `lg` grid of two-thirds and one-third, stacked below that. Verify the template uses generated utilities only: no `<style>` block and no `bg-[#` or `text-[#`.
- [x] 3.3 Rewrite `SkillCard` to render `title`, `description`, and a `NuxtLinkLocale` to `url` whose label is `skills.index.learnMore` beside a `stoneSrc` image. Rewrite `SkillsGrid` to pass `stoneSrc` from `piedras_saber_mas/boton-saber-mas-${(index % 7) + 1}.png`, paint the band `bg-adapt-skills-sea`, and apply `border-adapt-skills-rule` and `border-adapt-aqua` only from `lg` as design.md describes. Verify a card does not render `image`, `date`, `readTime`, or `tags`.
- [ ] 3.4 Delete `apps/web/app/components/skills/SkillsFilterSidebar.vue`. Verify `rg SkillsFilterSidebar apps/web` returns no matches, and `pnpm typecheck` in `apps/web` passes.

## 4. Index check

- [x] 4.1 Open the skills index in Spanish, English, and Italian. Verify the how-to top bar (wordmark, language switcher, session control, menu), the translated hero and six topics, published skill titles from the API, learn-more links to `/skills/:slug`, and the empty state when the list is empty. Verify the detail page still shows its current header image and body.
