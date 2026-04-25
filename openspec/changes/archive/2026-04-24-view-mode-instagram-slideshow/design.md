## Context

`ViewModeInstagram.vue` renders search hits as vertical “posts”: header (username, location), a single full-width `<img>` from `doc.images[0]`, actions (share, pin), then caption. `DocumentImage` entries include `position`, `public_url`, and optional `title` / `description` / `credits` (`apps/web/app/types/index.ts`). The repo does not yet use `UCarousel` (no matches); Nuxt UI v4 may still expose a carousel—verify during implementation and prefer it if it fits accessibility and theming.

## Goals / Non-Goals

**Goals:**

- Present **all** images for each hit in **gallery order** (`position` ascending, consistent with `explorer-article-images` and `document.images` ordering).
- Provide **Instagram-like** media chrome for multi-image posts: **dot indicators**, **horizontal navigation** (touch swipe and/or pointer drag with scroll-snap, plus optional chevrons for pointer users).
- Keep card layout recognizable: header band, **large media header**, actions, caption, “View more…”.
- Preserve **pin** and **share** row behavior; preserve **placeholder** image on load error per image.
- Resolve **tap vs swipe**: opening the document from the media area SHALL remain possible without accidental opens when the user intended to change slides.

**Non-Goals:**

- Pinning **individual** carousel slides (image-level pins) in this viewmode—that remains the domain of article summary / `ArticleViewAI` per `explorer-article-images`.
- Full-screen in-feed lightbox for carousel images (optional future); reuse global `AppImageLightbox` only if a clear affordance is added later.
- Server or schema changes.

## Decisions

1. **Carousel implementation**  
   - **Primary**: Check `@nuxt/ui` for a documented `Carousel` (or equivalent) and use it if it supports keyboard, indicators, and touch without fighting project styles.  
   - **Fallback**: CSS **scroll-snap** horizontal strip (`overflow-x-auto`, `snap-x`) with programmatic dot navigation and optional chevron buttons—no new heavy runtime dependency unless product asks for Embla/Swiper.

2. **Data source**  
   - Use **`document.images` only** (ordered array); do not parse `fulltext` for images. Empty or missing array: show existing placeholder pattern (`/img/img_placeholder.png`).

3. **Document open vs slide change**  
   - On **pointerup** / **click** on the media region: if the interaction was a **horizontal drag** beyond a small threshold (e.g. 24–32px) or the carousel index changed during the gesture, **do not** emit `document-selected`.  
   - Otherwise, a **short tap** on the media MAY still open the document (matches current single-image behavior) **or** open only from caption / “View more…”—pick one in implementation and align spec scenarios; **recommended**: tap on media opens document only when **no** slide change occurred and movement is below threshold (closest to Instagram mobile).

4. **Aspect ratio**  
   - Instagram uses a fixed square for many posts; this product uses `object-cover` on a fluid width. **Keep** full-width responsive images; optional **max height** (e.g. `max-h-[70vh]` or `aspect-square` toggle) can be tuned in implementation for visual parity without blocking the change.

5. **Accessibility**  
   - Carousel container: `role="region"` with **aria-roving-tabindex** or **aria-live="polite"`** announcing current index when it changes (if not provided by Nuxt UI). Dots: `role="tablist"` / `role="tab"` or buttons with `aria-current` / `aria-selected` for the active slide. Images: meaningful `alt` from `title` or generic “Image N of M” via i18n.

## Risks / Trade-offs

- **[Risk] Swipe vs click ambiguity on hybrid devices** → Mitigation: movement threshold + ignore click if index changed during gesture.  
- **[Risk] Many large images hurt performance** → Mitigation: render only adjacent slides in DOM if using a component that supports virtualization; otherwise lazy `loading="lazy"` on non-active slides where valid.  
- **[Risk] Nuxt UI carousel API churn** → Mitigation: isolate carousel in a small inner component behind a thin adapter.

## Migration Plan

- Ship as a **pure frontend** change behind the existing Instagram viewmode toggle; no flags or data migration. Rollback: revert `ViewModeInstagram.vue` (and any new child file).

## Open Questions

- Whether to use **Nuxt UI Carousel** vs **scroll-snap**—resolve in first implementation PR after a quick API check in the installed `@nuxt/ui` version.
