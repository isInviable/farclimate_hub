# Tasks

## 1. Stories layout

- [x] 1.1 Add `apps/web/app/layouts/stories.vue` with the page slot, `SiteFooter`, and `SiteNavOverlay`, plus a fixed top-right button of four `bg-adapt-yellow` bars that calls `useSiteNav().toggle` and uses the existing open label. Set `layout: 'stories'` on `pages/stories/index.vue` and `pages/stories/[slug].vue`. Verify neither route renders `SiteHeader`, the wordmark, the language switcher, or the session control, and that the button opens the overlay.

## 2. Content and audio

- [x] 2.1 Replace `storiesIndexSchema` with `hero.wordmark`, `hero.subtitle`, `hero.paragraphs`, `hero.image`, and `cards` of `{ slug, name, line }`. Add `storyArticleSchema` for the hero, identity, lead, banner, and chapters in design.md, and make `storySchema.hero` optional. Verify `pnpm typecheck` in `apps/web` passes.
- [x] 2.2 Fill `content/{en,es,it}/stories-index.json` with the same Spanish poster copy (wordmark HIS / TO / RIAS, subtitle "detrás de las recetas", the three template paragraphs, image `/img/adaptarium/stories/historias-portada.jpg`) and the four cards in order: Gabriella / `water-smart-agriculture-extremadura`, María / `sustainable-fisheries-galicia`, Lorena / `restoring-forest-resilience`, Joana / `agriculture-adaptation-europe`, each `line` the story's current title. Fill `content/{en,es,it}/story-article.json` with the same Spanish Alfonso text, portrait `historia-portada-1.jpg`, scene `alfonso.jpg`, banner `alfonso-paisaje.jpg`, and audio `/audio/audio-prueba.mp3`. Verify the three index files match each other and the three article files match each other.
- [x] 2.3 Save the template clip to `apps/web/public/audio/audio-prueba.mp3`. Verify the file is present and is not requested from `sindicatoaudiovisual.com` by the page.

## 3. Index poster

- [x] 3.1 Build the index poster and render it from `pages/stories/index.vue`. Map card index to `historias-3.png` / `text-adapt-orange`, `historias-1.png` / `text-adapt-sea`, `historia-2.png` / `text-adapt-yellow`, and `historias-3.png` / `text-adapt-orange`. The column is a locale-aware link. At 1024px and wider the hero splits photograph and copy and the cards are four columns; below that the hero is one column and the cards stack. Verify at 1280px the first and fourth portraits are the basket image, the names are Gabriella, María, Lorena, and Joana, and the old card list (tag, date, excerpt, Read) is gone.
- [x] 3.2 Open `/stories`, `/es/stories`, and `/it/stories`. Verify each shows the Spanish wordmark and "Descubre estas experiencias en la voz de sus protagonistas.", and that activating Lorena on `/es/stories` opens the Spanish `restoring-forest-resilience` route. At 390px verify the four columns stack in that order with no horizontal scroll.

## 4. Story article

- [x] 4.1 Build the article from `story-article.json` and render it from `pages/stories/[slug].vue` when the story has no `showcase`. Keep `StoryDetailHero` plus `StoryKitchenSinkPage` when `showcase` is set. A missing slug stays a 404. At 1024px and wider the hero and the text bands are a 2/5 and 3/5 split; below that the left panel stacks above the right. Verify a story shows "Alfonso", "La cosecha que cada invierno cambia con el mundo.", "Combatir y construir", "METODOLOGÍA", "PONDERACIÓN", and "RESULTADOS", the first answer begins "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.", and "Content coming soon." is absent.
- [x] 4.2 Open `water-smart-agriculture-extremadura` and `agriculture-adaptation-europe` in English and confirm the article text matches, including a pull quote containing "Quisque rutrum." Start the clip and confirm it plays from `/audio/audio-prueba.mp3`. Open the kitchen-sink story and confirm the showcase is still there and the Alfonso article is not. Open a slug with no content file and confirm the response is not found.

## 5. Surrounding pages

- [x] 5.1 On the home page at 390px, verify the top bar still shows the language switcher, the session control, and the hamburger. On a story page, activate the hamburger and then the solutions item, and verify the overlay closes and the explorer opens. Verify the home recipe band is still `bg-adapt-aqua`.

## Workflow follow-up

- Archive the change after review.
