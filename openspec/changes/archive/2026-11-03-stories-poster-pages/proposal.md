# Proposal

## Why

The stories index is still a photo hero and a stack of editorial cards, and each story is a hero plus "Content coming soon." The section the public site links to is a poster: a sea-glass hero, four portrait columns, and a story page laid out like the Alfonso article. Visitors cannot read that section in the form the design already has.

## What Changes

- Replace the stories index with one poster. The hero is the sea-glass photograph with a stacked wordmark, a subtitle, and three short paragraphs. Under it, four equal columns each show a first name, one line, and a black-and-white portrait. The whole column links to that story.
- The four columns use the three portraits already in `public/img/adaptarium/stories/`, in template order, and the fourth column repeats the first portrait. Name colors follow the same cycle: orange, teal, yellow, orange.
- Replace the story detail body with the Alfonso article layout. Every story shows the same placeholder article, copied from the template as it is: identity block, two questions with a pull quote, a full-bleed quote, then Proyecto / Metodología (with the audio clip), Ponderación, and Resultados. The copy stays in Spanish on en, es, and it. It is placeholder text, not a translation task.
- The kitchen-sink story keeps its component showcase. These two layouts do not replace it.
- The stories index and each story page drop the default header. The only control is a yellow hamburger that opens the existing overlay (home, then the six section bands). Language and session controls are not on these pages.

## Capabilities

### New Capabilities

- `stories-page`: The stories index poster and the shared Alfonso story article, including routes, content shape, images, and the placeholder copy.

### Modified Capabilities

- `site-navigation`: The stories index and story pages are an exception to the top bar. They show only the hamburger and the existing overlay, without the wordmark, language switcher, or session control.

## Impact

- `apps/web/app/pages/stories/index.vue` and `apps/web/app/pages/stories/[slug].vue`, plus new poster and article components. The default layout's `SiteHeader` no longer wraps these routes.
- `storiesIndexSchema` and `storySchema` in `apps/web/content.config.ts`, and `content/{en,es,it}/stories-index.json` plus the four story files, change shape. The Alfonso strings are identical in every locale file.
- Images already in `apps/web/public/img/adaptarium/stories/`. The audio clip is saved locally from the template's `audio-prueba.mp3`. No API or database changes.
