# Tasks

## 1. Home content

- [x] 1.1 Extend `homeSchema` in `apps/web/content.config.ts` with `recipe`, `inspire` (slides and `tone` enum `blue | yellow | aqua`), and `stories` as specified in design.md; verify `pnpm typecheck` in `apps/web` passes
- [x] 1.2 Fill `content/{es,en,it}/home.json` with the new objects (Spanish from the prototype, English and Italian translated; image paths under `/img/adaptarium/`; recipe CTA image `boton-9.png`; stories CTA image `historias-boton-2.png`); verify `pnpm build` in `apps/web` succeeds with no content validation errors

## 2. Recipe diagram

- [x] 2.1 Add an `appearance` prop to `StoneCta` (`orange` default, `light` for white text) and leave `HomeHero` on the default; verify in the browser that the hero label stays orange
- [x] 2.2 Create `HomeRecipe` (aqua ground, lead and orange count, four groups, pile with `object-contain`, `StoneCta` appearance `light`) and render it from `pages/index.vue` after `HomeStats`; verify at 1280px the groups sit around the pile, at 390px the solutions link is below the pile with no horizontal scroll, and activating it opens the explorer in the current locale
- [x] 2.3 Confirm the Spanish diagram shows Introducción (2), Situación de partida (4), Cómo se hizo (4), Qué se logró (5), and the count "15", and that those strings come from `content/es/home.json`; verify by editing the count in the JSON, reloading, and seeing the new figure without a component change, then restoring "15"

## 3. Inspiration carousel

- [x] 3.1 Create `HomeInspire` with `UCarousel` (`loop`, `dots`, `arrows`, `basis-full` items, arrows `hidden` below `lg`) and render it after `HomeRecipe`; verify the three Spanish slides match the spec order, a dot changes the slide, and at 390px the arrows are not shown and the title sits above the card
- [x] 3.2 Map `tone` to literal `bg-adapt-blue`, `bg-adapt-yellow`, and `bg-adapt-aqua` classes inside the component; verify in DevTools that each card's background is the palette color while the stone JPEG keeps its own background

## 4. Stories call to action

- [x] 4.1 Create `HomeStories` (full-bleed `historias-home-1.jpg`, heading lines, `StoneCta` appearance `light`) and render it after the carousel; verify at 1280px the full photograph frame shows, at 390px the heading sits on the dark left of the photo with no horizontal scroll, and the label is a text node beside `historias-boton-2.png`
- [x] 4.2 Verify activating the stories link opens `/stories` in the current locale

## 5. Locales

- [x] 5.1 Open `/`, `/es`, and `/it` and verify each shows hero, stats, recipe, carousel, stories, and footer, with that locale's carousel title; verify the built HTML for those three routes contains the recipe count

## Workflow follow-up

- Archive the change after review. The `home-page` purpose sentence in `openspec/specs/home-page/spec.md` already mentions the three new sections.
