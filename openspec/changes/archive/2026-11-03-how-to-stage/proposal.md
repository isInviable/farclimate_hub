# Proposal

## Why

`/how-to` is still a long blue page of seven stacked steps. The design for this section is one full screen: an introduction, a single screenshot that changes with the step, and a bottom bar of seven colored cells. Visitors cannot learn the database the way the prototype teaches it.

## What Changes

- Replace the scrolling guide with one stage. The introduction sits on the left, the screenshot in the center, and a stone link to the solutions explorer at the top right. A seven-cell bar sits on the bottom edge of the stage.
- The prototype leaves every cell closed and shows a generic screenshot until hover. This page opens on step 1, Busca: its text is visible and its screenshot is showing. Hover previews another step on a device that can hover; leaving returns to the pinned step. Click, tap, and keyboard pin a step. Touch does not use hover.
- Below 1024px the introduction, screenshot, stone link, and steps stack. From 768px to 1023px the steps sit in two columns. The active step grows in place and shows its paragraph. The WordPress mobile bar collapses to zero width; this page does not copy that.
- The site top bar, overlay, and footer stay. The stage fills the viewport under the top bar. The step bar belongs to the stage, so it does not cover the footer.
- Spanish copy comes from the prototype. English and Italian are translations of that copy and are provisional. Step 4's paragraph is the same sentence as step 3 in the prototype; it stays that way until an editor replaces it in the content file. The seventh title is rendered as "Genera recursos", correcting the prototype's "RECURSOs".
- The call to action label is HTML beside a stone image, in the current locale, and opens the solutions explorer. The prototype stone has Spanish words painted into the file and links to a static JPG; that file is not used.
- Screenshots `base-1.png` through `base-6.png` are already in `public/img/adaptarium/capturas/`. Step 7's file is missing on the prototype server and in the repo; the content path is reserved so adding the file needs no code change. The generic `base-de-datos.jpg` is no longer the resting image.
- Colors come from the designer's palette. An existing token is used when it is the same swatch or within a short distance of the designer hex. Two colors are not close to any current token and are added: the stage ground `#37a797`, and the designer green `#92c8b7` (the current aqua `#85cec4` is a different swatch). Blue `#024ec1` stays on the current blue token `#0f4fc4`, and cream `#f7e7d8` stays on paper `#f8e8d9`. Orange, brown, yellow, mist, and ink already match.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `how-to-page`: The blue header and the alternating seven-image guide are replaced by one stage, a shared screenshot, and a bottom bar that opens on step 1. The explorer call to action, per-locale content, and prerender stay.
- `site-design-tokens`: The ADAPTARIUM palette gains the stage ground `#37a797` and the designer green `#92c8b7`. Existing token hexes stay.

## Impact

- `apps/web/app/pages/how-to.vue` and a new stage component. `howToSchema` in `apps/web/content.config.ts` and `content/{en,es,it}/how-to.json` change shape.
- `apps/web/app/assets/css/main.css` gains two color tokens. Home, navigation, explorer, and connected colors stay on their current tokens.
- Prerender rules for `/how-to`, `/es/how-to`, and `/it/how-to` stay. No API or database changes.
