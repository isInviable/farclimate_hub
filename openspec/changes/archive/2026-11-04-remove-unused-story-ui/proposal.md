# Proposal

## Why

The poster stories replaced the old card list and the kitchen-sink showcase, but those components, content files, and images are still in the project. They are not part of the public stories pages anymore, and keeping them makes the next edit look like the old UI is still supported.

## What Changes

- **BREAKING**: `/stories/kitchen-sink`, `/es/stories/kitchen-sink`, and `/it/stories/kitchen-sink` no longer render a component showcase. They respond as not found, the same as any other slug with no content file.
- Remove the kitchen-sink content files and the page branch that renders `StoryDetailHero` and `StoryKitchenSinkPage`.
- Delete story components that nothing outside that retired branch renders. Nuxt auto-imports `components/stories` by filename, so a component counts as used only when a template tag names it.
- Keep `StoriesIndexPoster`, `StoryArticle`, and `StoriesIndexHero`. The last one is the explorer landing banner.
- Remove the unused hero, coming-soon, and showcase fields from the four remaining story files, then delete `public/img/stories/` once nothing references those paths. The poster photographs under `public/img/adaptarium/stories/` stay.

## Capabilities

### New Capabilities

### Modified Capabilities

- `stories-page`: The story article requirement no longer keeps a kitchen-sink showcase. That slug is not found.

## Impact

- `apps/web/app/pages/stories/[slug].vue` and the unused files under `apps/web/app/components/stories/`.
- `apps/web/content.config.ts` story schema, `content/{en,es,it}/stories/kitchen-sink.json`, and the hero and coming-soon fields on the four remaining story files.
- `apps/web/public/img/stories/`.
- Explorer, home, how-to, and the four public story articles stay as they are.
