# Proposal

## Why

The stories index and each story article still use a floating yellow hamburger with no wordmark and no language switcher. The rest of the public site, including how-to, already uses one top bar with the ADAPTARIUM logo, language links, session control, and menu. Stories should use that same bar so people can identify the site and change language without leaving the page.

## What Changes

- The stories index (`/stories`, `/es/stories`, `/it/stories`) and each story article show the public-site top bar: ADAPTARIUM wordmark, EN / ES / IT, the session control, and the hamburger that opens the existing overlay.
- The fixed yellow four-bar button is removed from those pages.
- The overlay, poster, portrait columns, and article regions stay as they are.
- Explorer, article, and admin headers stay as they are.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `site-navigation`: The stories index and story articles stop being the yellow-hamburger exception and use the same top bar as the other public pages.
- `stories-page`: The stories index and each story article are served with that top bar. Poster and article content do not change.

## Impact

- `apps/web/app/layouts/stories.vue`, which both stories pages use.
- Existing `SiteTopBar` (`mode="bar"`), `SiteLocaleSwitcher`, `SiteSessionButton`, and `SiteNavOverlay`. No new copy.
- Specs `site-navigation` and `stories-page`.
