# Design

## Context

See proposal.md for motivation. `nuxt.config.ts` registers `~/components/stories` with `pathPrefix: false`, so each filename is a template tag and a missing import is not evidence that a component is unused. A repo search for those tag names, for `resolveComponent`, and for tests found no dynamic registration.

`pages/stories/[slug].vue` renders `StoryDetailHero` and `StoryKitchenSinkPage` only when the slug is `kitchen-sink` or the story document has `showcase`. `StoryKitchenSinkPage` is the only parent of the section components. `StoryCard` has no page parent; it is the only parent of `StoryTag` and `StoryReadButton`. `StoryAuthorRow` is used by `StoryCard` and `StoryDetailHero` only.

`StoriesIndexHero` is rendered by `pages/explorer/index.vue`. `StoriesIndexPoster` and `StoryArticle` are the live stories pages. The four public story files still carry a `hero` and `comingSoon` that the article page does not read. Those fields, plus `content/{en,es,it}/stories/kitchen-sink.json`, are the only references to `public/img/stories/`. The `.jpg` files in that folder have no references. Poster images live under `public/img/adaptarium/stories/` and stay.

## Goals / Non-Goals

**Goals:**

- Make `/stories/kitchen-sink` and its locale variants respond as not found.
- Delete only the story components whose template tags have no remaining parent outside the retired branch.
- Drop the content fields that point at `public/img/stories/`, then delete that folder.
- Leave the four story routes and the Alfonso article in place. Each remaining story file keeps its `slug` so the route still resolves.

**Non-Goals:**

- Moving `StoriesIndexHero` out of `components/stories/`.
- Changing the poster index, the shared article, explorer, home, or how-to.
- Editing archived change documents that mention the old showcase.

## Decisions

### A component is unused when no template names it

Search the tag name, not an import. Delete a file only when every remaining hit is its own definition or a child that is also being deleted. That keeps `StoriesIndexHero`, `StoriesIndexPoster`, and `StoryArticle`.

Alternative: delete every file under `components/stories` except the two poster components. That would remove the explorer landing banner.

### Retire the showcase by deleting its content, not by a special 404

The page already returns not found when `useStoryContent` finds no document. Delete the three `kitchen-sink.json` files and the `isKitchenSink` branch. A visitor who opens that slug then hits the existing missing-story path. Do not add a hardcoded slug check.

### Shrink the story schema to the slug

`storySchema` becomes `{ slug }`. Remove `storyAuthorSchema`, `storyDetailHeroSchema`, `storyMetaBarSchema`, `storyShowcaseSectionSchema`, `storyShowcaseSchema`, and `comingSoon`. Rewrite the twelve remaining locale story files (four slugs, three locales) to `{ "slug": "<filename>" }`. The index cards and `story-article.json` already hold the visible copy.

Alternative: leave the unused hero JSON in place. The image paths would still count as references, so `public/img/stories/` could not be deleted.

### Delete the image folder only after the content search is empty

After the JSON edits, search for `/img/stories/`. The only expected leftover is the archived design note. Then delete `apps/web/public/img/stories/`. Do not delete `public/img/adaptarium/stories/`.

## Risks / Trade-offs

- [A tag is built from a string this search missed] → The implementation search includes the component names and `resolveComponent` again before deleting, and the explorer page is opened to confirm `StoriesIndexHero` still renders.
- [Content SQLite keeps the old kitchen-sink document] → Restart the dev server after the schema and JSON change, the same way the poster change rebuilt collections. Confirm the kitchen-sink route is not found after that restart.
- [The four story files become slug-only and look incomplete] → That is the point. Visible copy stays on the index and the shared article. Deleting the files would 404 the four stories.
