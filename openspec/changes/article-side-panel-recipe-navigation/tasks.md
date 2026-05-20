## 1. Navigation model

- [x] 1.1 Replace primary `RollingMenuRail` items with `recipe`, `chat`, `contacts`; remove standalone `summary` primary; set default active primary to `recipe` on document load (modal chrome).
- [x] 1.2 Add i18n strings for new primary labels and submenu labels (`Summary+`, `Map`, `Contacts` panel title as needed) in `apps/web` locale files.
- [x] 1.3 Wire **Contacts** top-level panel: render existing contacts UI (from `SummaryContactsSlide` or extracted inner component) without secondary nav.

## 2. Recipe layout and scroll stack

- [x] 2.1 Build ordered segment model: Summary+ block, each non-empty `recipeSections` entry, synthetic Map segment; align order with `explorer-structured-recipe` keys.
- [x] 2.2 Replace recipe `SlideDeck` with a single scrollable right column containing `<section>` per segment, each with stable `id` and `scroll-mt-*` for sticky offset.
- [x] 2.3 Implement fixed-width left column + flex right column; make left column sticky (or independently scrollable on short viewports) per design.
- [x] 2.4 For **Summary+** segment, move existing title/date/`SummaryMainLeftColumn` into left column and `SummaryMainContent` + `SummaryMainGallery` into right column within the first section.
- [x] 2.5 For markdown segments, render `RecipeSlideBody` (or equivalent) in right column; left column shows decorative treatment keyed by `section.key` using existing `DecorativeCorner` / icons / placeholder art.
- [x] 2.6 Render map as final section using existing `SummaryMapSlide` or map component with same data wiring as today.

## 3. Secondary navigation and headers

- [x] 3.1 Show `ArticleSecondarySlideNav` (or renamed variant) only when primary is `recipe`; feed it segment labels; on selection, `scrollIntoView` target segment.
- [x] 3.2 Optional: add `IntersectionObserver` to sync active secondary highlight with scroll; if deferred, document in code comment referencing open design question.
- [x] 3.3 Adjust header `h2` behavior so slide title reflects active recipe segment or hides for `chat`/`contacts` per design decision.

## 4. Cleanup, a11y, and tests

- [x] 4.1 Remove dead state (`summary` primary, `summaryIndex`, recipe `recipeIndex` slide state) and unused imports; grep for `SlideDeck` in article explorer scope.
- [x] 4.2 Update `role="tabpanel"` / `aria-controls` wiring to match new ids; verify keyboard navigation through primary rail.
- [x] 4.3 Update or add Playwright / component tests that referenced old tab ids or slide indices; add `data-testid` on segments if tests need hooks.

## 5. Verification

- [x] 5.1 Manually verify modal: Recipe default, scroll through Summary+ → sections → Map; Chat and Contacts one click; no slide “next” for recipe.
- [x] 5.2 Run targeted web test suite (`pnpm` filter for `apps/web`) and fix failures.
