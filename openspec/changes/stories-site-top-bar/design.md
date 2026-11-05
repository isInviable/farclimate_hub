# Design

## Context

Both stories pages set `layout: 'stories'`. That layout paints a paper page, a fixed yellow four-bar button, the footer, and the overlay. How-to, skills, and the connected index use `SiteTopBar` in `bar` mode: a sticky white bar with the ADAPTARIUM wordmark, the language switcher, the session control, and a menu icon. See proposal.md for why stories should match that bar.

## Goals / Non-Goals

**Goals:**

- Put that bar on the stories index and every story article by changing the shared stories layout.
- Remove the yellow button.
- Leave the overlay wired to the same menu state.

**Non-Goals:**

- Switching the stories pages onto the `site` layout.
- Changing the poster, the four portraits, or the article regions.
- Changing the home bar, which hides the wordmark and the menu at desktop width.
- Changing the explorer, article, or admin header.

## Decisions

### Keep the stories layout and mount the existing bar

`layouts/stories.vue` replaces the yellow button with `SiteTopBar` in `bar` mode. The footer and overlay stay. Both pages already use this layout, so neither page file needs a layout change.

Alternative: set `layout: 'site'` on the index and the article. That layout already has the bar, but its page background is white and the stories shell is paper. One edit in the stories layout keeps that shell and avoids repeating the choice on two pages.

### Use the whole bar, including the session control

The how-to bar is one component. It includes the wordmark, EN / ES / IT, sign-in or sign-out, and the menu icon. Stories get that component rather than a bar with the session control removed.

### Let the bar sit above the poster

The bar is sticky and in normal flow, as it is on how-to. The poster and the article start below it. The yellow button was fixed over the hero; the new bar does not cover the wordmark or the portraits.

`useSiteNav` already treats `/stories` and its children as the stories section, so the overlay marks that item active on the index and on an article. No new menu item.

## Risks / Trade-offs

- [The sticky bar shortens the first screen of the poster] → Accept it. Pulling the poster under the bar would hide the logo behind the hero.
- [A story article's hero was composed for a page with no bar] → The article still starts below the bar. Do not add a negative offset to recover the old overlap.
