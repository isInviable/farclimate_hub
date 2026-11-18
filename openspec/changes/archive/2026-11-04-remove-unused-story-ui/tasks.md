# Tasks

## 1. Confirm references

- [x] 1.1 Search the repo for the story component tag names and for `resolveComponent`. Confirm the only live parents outside the kitchen-sink and card graph are `StoriesIndexPoster`, `StoryArticle`, and `StoriesIndexHero` on the explorer index. Do not delete a file that still has another parent.

## 2. Content

- [x] 2.1 Delete `content/{en,es,it}/stories/kitchen-sink.json` and verify a search for `kitchen-sink` in `apps/web/content` returns nothing.
- [x] 2.2 Change `storySchema` to `{ slug }` and remove `storyAuthorSchema`, `storyDetailHeroSchema`, `storyMetaBarSchema`, `storyShowcaseSectionSchema`, `storyShowcaseSchema`, and `comingSoon`. Rewrite the twelve remaining story files to a slug matching the filename. Verify one file parses as that object and the schema no longer mentions `showcase`.

## 3. Page and components

- [x] 3.1 Remove the kitchen-sink branch from `pages/stories/[slug].vue` so a found story renders `StoryArticle`. Verify the page no longer mentions `showcase`, `StoryDetailHero`, or `StoryKitchenSinkPage`.
- [x] 3.2 Delete `StoryDetailHero`, `StoryKitchenSinkPage`, `StoryMetaBar`, `StorySectionHeading`, `StoryOverviewGrid`, `StoryImageGallery`, `StoryStatGrid`, `StoryDataTable`, `StoryQuoteSection`, `StoryLinkList`, `StoryTeamSection`, `StoryDonutPair`, `StoryTimelineStrip`, `StoryAuthorRow`, `StoryCard`, `StoryTag`, and `StoryReadButton`. Verify a tag search finds none of those names, and that `StoriesIndexHero`, `StoriesIndexPoster`, and `StoryArticle` are still present.

## 4. Images

- [x] 4.1 Search for `/img/stories/`. When the only leftover is the archived poster design note, delete `apps/web/public/img/stories/`. Verify that folder is gone and `public/img/adaptarium/stories/` is still there.

## 5. Routes

- [x] 5.1 Restart the content dev server so the collection rebuilds. Open one of the four stories and confirm the Alfonso article, including "La cosecha que cada invierno cambia con el mundo." Open `/stories/kitchen-sink` and confirm not found. Open the explorer index and confirm the landing banner still renders.

## Workflow follow-up

- Archive the change after review.
