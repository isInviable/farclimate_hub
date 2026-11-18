# Design

## Context

`SiteFooter.vue` renders a `bg-neutral-900` footer: a three-column menu, then a bordered bar with the copyright line and legal links. `useFooterContent()` supplies that copy from `content/*/footer.json`. Layouts already mount `SiteFooter`; none of them need edits. See proposal.md for why the funding block is added, and `specs/site-footer/spec.md` for the required order and wording.

Assets in `apps/web/public/img/logos/`:

- `logo farclimate blanco.svg` — fills are already `#FFFFFF`.
- `EN_FundedbytheEU_RGB_WHITE Outline.png` — white outline PNG, not an SVG.
- `WBF_SBFI_EU_Frameworkprogramme_E_RGB_pos_quer.ai.svg` — positive Swiss mark. `.cls-1` is `#212125`, `.cls-2` is `red` (the shield), `.cls-3` is `#fff` (the cross). Most wordmark paths have no class and therefore paint black.

## Goals / Non-Goals

**Goals:**

- Insert the two new rows in `SiteFooter.vue` only, styled with Tailwind to match the existing footer.
- Produce a white inverse Swiss SVG that stays readable on `neutral-900`, without changing the colored source.

**Non-Goals:**

- Localizing the disclaimer, or moving it into `footer.json`.
- Linking the marks, renaming the official files, or restyling the menu and copyright bar.
- Changing which layouts render the footer.

## Decisions

### 1. Static markup in the footer component

Put both rows in `SiteFooter.vue`, between the menu grid and the copyright bar. Hardcode the disclaimer paragraph and the three image paths. Do not extend `useFooterContent()` or the locale JSON files.

Alternative: store the paragraph in `footer.json` for en/es/it. Rejected because the supplied sentence is one English legal text for every locale, and copying it into three files would imply it should be translated.

### 2. Layout

- Funding block: `mt-10 border-t border-neutral-50/20 pt-6`, same divider language as the copyright bar, which keeps its own top border.
- Marks: `flex flex-wrap items-center gap-8`. Each image is `h-12 w-auto object-contain`. Equal height keeps the wide wordmarks aligned; wrapping covers narrow viewports without a different order.
- Disclaimer: `mt-6 max-w-4xl font-mono text-xs leading-relaxed text-neutral-200`.
- Use plain `<img>` elements. Both an SVG and a PNG must render from `public/`, and the image module is unnecessary for these static files.
- Keep the official filenames, including spaces. Bind the paths from script (`:src`) instead of writing `%20` into static `src` attributes. Nuxt rewrites a static public `src` into a `virtual:public` import, and that import 404s when the path contains an encoded space, which takes down the layout.
- Alt text: `FARCLIMATE`, `Funded by the European Union`, `Swiss State Secretariat for Education, Research and Innovation`.

### 3. White inverse of the Swiss mark

Add `WBF_SBFI_EU_Frameworkprogramme_E_RGB_neg_quer.svg` beside the positive file. Leave `..._pos_quer.ai.svg` untouched so the official colored artwork remains in the repo.

Paint rules for the derivative:

- Root `fill="#ffffff"`, so classed dark text and unclassed black wordmark paths become white.
- Shield (`.cls-2`): `fill="#ffffff"`.
- Cross: do not paint it white on top of the white shield. Mask the shield with the cross polygon subtracted (white shield shape, black cross in the mask) and omit the standalone cross polygon. The footer background then shows through the cross.
- Drop the red fill. No other hues remain.

Alternative: set the cross fill to `#171717` to match `neutral-900`. Rejected because the cross would be a baked-in grey and would mismatch if the footer background changes. The spec requires the footer background to show through.

### 4. No layout or content-schema edits

`SiteFooter` is already included by the home, site, stories, solutions, article, connected, and default layouts. The new rows appear everywhere the footer appears.

## Risks / Trade-offs

- [English disclaimer on es/it pages] → Recorded in the spec. A later change can translate it if the consortium asks.
- [Official Swiss artwork is easy to damage while inverting] → Write a new `neg` file; do not edit the positive SVG.
- [Cross disappears if the mask is wrong] → Check the derivative on `bg-neutral-900` before finishing: white wordmark, white shield, dark cross.
- [Uneven intrinsic sizes] → Shared `h-12` may need a small tweak after visual check. That does not change the spec.

## Migration Plan

Ship the new SVG and the footer template together. Rollback is reverting `SiteFooter.vue` and deleting the `neg` SVG. No data migration.
