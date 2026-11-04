# Design

## Context

See proposal.md for motivation. The index is `pages/stories/index.vue` on the default layout, which renders `SiteHeader`. Copy comes from `content/{en,es,it}/stories-index.json` through `storiesIndexSchema` and `useStoriesIndexContent`. Each story is `pages/stories/[slug].vue`: `StoryDetailHero`, then `StoryKitchenSinkPage` when `showcase` is set, otherwise a coming-soon paragraph. `useStoryContent` loads `content/{locale}/stories/{slug}.json`. The overlay and its six bands live in `SiteNavOverlay` and `siteNavItems`. Palette utilities and `font-adapt-*` are already in `main.css`. The photographs are already in `public/img/adaptarium/stories/`.

## Goals / Non-Goals

**Goals:**

- One stories layout whose only control is the yellow hamburger and the existing overlay.
- Index columns whose portrait and name color come from position, so a content edit cannot repaint column 3.
- One shared article document, rendered for every story that has no showcase.

**Non-Goals:**

- Restyling the kitchen-sink showcase or its current hero.
- Translating the Alfonso text, or giving the four stories different articles.
- New color tokens. Adding language or session controls to these pages.
- Changing the home, how-to, explorer, or connected headers.

## Decisions

### 1. A stories layout, not another top-bar mode

`layouts/stories.vue` renders the page, `SiteFooter`, and `SiteNavOverlay`, plus a fixed yellow hamburger at the top right that calls `useSiteNav().toggle`. Both story routes set `layout: 'stories'`. `SiteTopBar` stays as it is for home and how-to.

The button is four yellow bars (`bg-adapt-yellow`), matching the template's icon, with the existing `siteNav.open` accessible name. It is `fixed`, so it stays available over the poster and the footer.

*Alternative*: a `mode="float"` on `SiteTopBar`. Rejected: that component owns the wordmark, language switcher, and session control this page must not show.

### 2. Portraits and colors are positional

The component maps index 0–3 to full utilities and paths written in source:

| Index | File | Name color |
|---|---|---|
| 0 | `historias-3.png` | `text-adapt-orange` |
| 1 | `historias-1.png` | `text-adapt-sea` |
| 2 | `historia-2.png` | `text-adapt-yellow` |
| 3 | `historias-3.png` | `text-adapt-orange` |

`adapt-sea` (`#37a797`) stands in for the template's `#37a697`. The aqua band and the index ground under the portraits use `bg-adapt-foam` (`#92c8b7`) for the template's `#8dc7b8`. Page ground is `bg-adapt-paper`. Cream type is `text-adapt-paper`. No hex is added.

*Alternative*: a `tone` and `image` on each card. Rejected: the spec fixes the cycle, including the repeated first portrait.

### 3. Index content is the poster, not the old card

Replace `hero.title` / `subtitle` / `backgroundImage` and the card's tag, date, read time, excerpt, image, and read label.

```ts
hero: {
  wordmark: string[]       // ["HIS", "TO", "RIAS"]
  subtitle: string
  paragraphs: string[]
  image: string            // /img/adaptarium/stories/historias-portada.jpg
}
cards: { slug: string, name: string, line: string }[]
```

`name` is the first name already decided: Gabriella, María, Lorena, Joana. `line` is the story's current title. The same Spanish hero strings are written into en, es, and it. `useStoriesIndexContent` stays. Below 1024px the hero is one column and the cards stack in order; at 1024px and wider the hero splits photograph and copy, and the cards are four columns.

Wordmark and names use `font-adapt-heavy`. The subtitle uses `font-adapt-title`. Card lines use `font-adapt-keyword` uppercase. Paragraphs use `font-adapt-body`.

### 4. One article file, four routes

Add `content/{locale}/story-article.json` and a `storyArticleSchema`. The four story files keep their slug. `[slug].vue` branches:

- `showcase` present: the current `StoryDetailHero` plus `StoryKitchenSinkPage`, unchanged.
- otherwise: the shared article, ignoring that file's hero and `comingSoon`.

`storySchema.hero` becomes optional so the four files do not have to carry a fake hero. A missing slug is still a 404, including when the article file exists. The article strings are the template's Spanish, copied identically into en, es, and it.

The document follows the regions in the spec:

```ts
hero: { wordmark, subtitle, name, line, portrait, scene }
identity: { theme, name, role, place }
lead: { question, paragraphs: string[], quote, question2, paragraphs2: string[] }
banner: { image, quote }
chapters: {
  kicker?: string          // "PROYECTO" on the first only
  label: string            // METODOLOGÍA, PONDERACIÓN, RESULTADOS
  question: string
  paragraphs: string[]
  audio?: { title: string, src: string }
  closing?: string[]
}[]
```

Paths: portrait `historia-portada-1.jpg`, scene `alfonso.jpg`, banner `alfonso-paisaje.jpg`. At 1024px and wider the hero and the text bands are a 2/5 and 3/5 split. Below that, the left panel stacks above the right.

*Alternative*: paste the article into each of the four story files. Rejected: the spec requires one article, and four copies will drift.

### 5. Audio is a local file

Save the template's `audio-prueba.mp3` to `public/audio/audio-prueba.mp3` and point `audio.src` at `/audio/audio-prueba.mp3`. The player is a native `audio` element with that title as its accessible name. No new dependency, and the page does not request the template host.

## Risks / Trade-offs

- [The four index names no longer match the Alfonso article they open] → Accepted. The article is placeholder copy until real interviews replace `story-article.json`.
- [en, es, and it can be edited apart] → The task writes the same strings into all three. A later edit must keep them equal until a translation change says otherwise.
- [`adapt-foam` and `adapt-sea` are a few steps off the template hexes] → Accepted, same rule as the how-to stage: no new token inside a short distance of an existing one.
- [The audio file is someone else's test clip] → Stored locally because the page must not depend on the template host. Replacing the file needs no code change.

## Migration Plan

Content shape changes with the deploy. There is no stored user data. Rollback is reverting the commit. Old card images under `public/img/stories/` stay on disk; the new pages do not reference them.

## Open Questions

None.
