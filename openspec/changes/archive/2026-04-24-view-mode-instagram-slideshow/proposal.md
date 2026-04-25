## Why

The explorer Instagram viewmode (`ViewModeInstagram.vue`) shows only the first entry in `document.images` as a static hero. Most knowledge documents now ship multiple ordered images; users expect an Instagram-style feed where each post’s media area supports a **carousel** (swipe or arrows, dot indicators) so every image is visible without leaving the list.

## What Changes

- Treat each result card’s **header media** as an Instagram-like **slideshow**: show all images from `document.images` in gallery order (same semantics as `explorer-article-images`: ordered array, `public_url`, optional metadata).
- Add **carousel controls** aligned with common Instagram patterns: visible **dot indicators** when there is more than one image, optional **previous/next** affordances, and **touch swipe** / pointer drag where feasible.
- Preserve existing card chrome: post header (username/location), actions row (share, pin), caption, “View more…”, and **tap-to-open-document** behavior (clarify whether tap on image vs. explicit control opens the document to avoid accidental navigation while swiping).
- **Single image** or **empty** `images`: keep a simple single-image or placeholder treatment without misleading multi-slide chrome.
- New user-visible strings (e.g. carousel labels, “Image N of M”) SHALL go through **i18n**.

## Capabilities

### New Capabilities

- `explorer-viewmode-instagram`: Behavioral requirements for the Instagram results viewmode—multi-image carousel in the post header, indicators, navigation, accessibility, and interaction with document open / pin / share.

### Modified Capabilities

- _(none)_ — Existing `explorer-article-images` already defines `document.images` shape and ordering; this change consumes that contract in a new surface without altering the document API spec.

## Impact

- **Primary**: `apps/web/app/components/explorer/wf/viewmodes/ViewModeInstagram.vue` (and optionally a small child component for the media carousel).
- **UI stack**: Nuxt UI / Tailwind patterns per project rules; may introduce Nuxt UI carousel or a minimal custom swiper if no carousel primitive is yet in use.
- **i18n**: `apps/web/i18n/locales/*.json` for any new aria or helper copy.
- **No** database or pipeline changes; data already exposed on search hits as `document.images`.
