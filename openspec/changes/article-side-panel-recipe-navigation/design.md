## Context

`ArticleSidePanel.vue` hosts `ArticleViewAI` in a modal. Today `ArticleViewAI` uses a five-column header grid: a `RollingMenuRail` with primary ids including summary and recipe, a secondary slide nav for summary slides and recipe slides, and a `SlideDeck` for recipe sections. Summary metadata lives in a split grid; recipe content is paged. Product feedback: **Recipe** is the hero artifact but is buried behind extra clicks and paging.

## Goals / Non-Goals

**Goals:**

- Surface **Recipe** as a first-class top-level destination beside **Chat** and **Contacts**.
- Fold the existing summary lead (title, dates, left metadata, main summary markdown, gallery) into **Recipe** as the first submenu item (**Summary+**), with **Map** last after all markdown sections.
- Replace recipe slide paging with **one continuous scroll** of segments in the right column.
- Apply a **fixed-width left column** for recipe: summary metadata on Summary+; decorative visuals for other segments.
- Keep data loading and markdown rendering aligned with existing recipe/summary components and `explorer-structured-recipe` ordering rules.

**Non-Goals:**

- Changing recipe ingestion, `/api/document-recipe`, or database schema.
- Reworking the standalone full-page article layout (`chrome="page"`) unless trivially shared—default scope is **modal** behavior used by the explorer side panel.
- New illustration assets pipeline beyond reusing existing decorative components (`DecorativeCorner`, static art, or placeholders agreed in implementation).

## Decisions

1. **Component ownership** — Implement navigation and layout primarily in `ArticleViewAI.vue` (and small presentational children), because `ArticleSidePanel.vue` is mostly fetch/pin chrome. Update i18n alongside template changes.

2. **Primary ids** — Replace `summary` / `recipe` / `chat` primary model with `recipe`, `chat`, `contacts`. Default active primary on open becomes **`recipe`** so the hero content is immediate.

3. **Recipe submenu data model** — Build an ordered array of segment descriptors: `{ id, type: 'summary' | 'markdown' | 'map', sectionKey? }`. Markdown entries reuse the same canonical ordering filter as today’s `recipeSections`. Map segment is synthetic, appended after markdown list.

4. **Scrolling vs secondary nav clicks** — Right column is a single `<div class="overflow-y-auto">` containing stacked `<section>` blocks each with a stable `id="recipe-segment-${id}"`. Secondary nav buttons call `scrollIntoView({ behavior: 'smooth', block: 'start' })`. Optionally use `IntersectionObserver` to sync active submenu highlight with scroll position (preferred for UX); fallback: highlight only on click.

5. **Header title row** — Today’s large `h2` slide title can map to **scroll-spy active segment** title (dynamic) or hide for non-recipe primaries; decision: show segment title only for recipe mode to reduce noise on Chat/Contacts.

6. **Left column content** — Summary+: reuse existing left column subtree. Markdown sections: use existing `DecorativeCorner` pattern with per-section iconography or a static decorative image map keyed by `section.key` (feature-flaggable placeholder `UIcon` grid if art missing).

7. **Contacts extraction** — Lift `SummaryContactsSlide` (or its inner list) into a top-level panel route `contacts` without duplicating data fetching.

8. **SlideDeck removal** — Remove `SlideDeck` / `ArticleSecondarySlideNav` usage for recipe; keep or adapt for other contexts only if still referenced elsewhere (grep before delete).

## Risks / Trade-offs

- **[Risk] Very long scroll** loses context → **Mitigation**: sticky mini TOC or secondary nav stays visible; segment headings use `scroll-mt-*` for offset under sticky header.
- **[Risk] `IntersectionObserver` complexity** → **Mitigation**: ship click-to-scroll first, add spy in a follow-up task if schedule slips.
- **[Risk] Breaking E2E selectors** tied to `article-primary-summary` → **Mitigation**: update tests and add stable `data-testid` on segments.
- **[Trade-off] Full-page mode divergence** → **Mitigation**: gate new layout with `chrome === 'modal'` if page layout must stay stable short-term.

## Migration Plan

1. Ship behind no feature flag if product accepts immediate UX swap; otherwise add `useRuntimeConfig` flag `experimentalArticleRecipeNav` default true in dev only.
2. Update Playwright specs referencing old tabs.
3. Rollback: revert `ArticleViewAI` commit; no database migrations.

## Open Questions

- Should `chrome="page"` inherit the same IA for parity, or stay legacy until a separate request?
- Art source for decorative left column: reuse corner SVGs only, or allow per-section Unsplash-style URLs from CMS later?
