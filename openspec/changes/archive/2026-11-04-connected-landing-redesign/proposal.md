# Proposal

## Why

`/connected` is still the old editorial index: a mono eyebrow, one heading, a horizontal stat strip, and four cards. The design for this section is the sea-glass landing (wordmark, mint introduction, live figures, and the four ways in). The dashboard, map, network, and UMAP still sit under the old site header, so the section does not share the public-site bar that `/how-to` already uses.

## What Changes

- Replace the connected index with the landing: a full-width sea-glass hero carrying the English CONNECTED / ACTION lockup, a mint introduction with the localized title and the four live counts, and a paper block whose heading is a numeral 4 plus a localized label. The four cards stay live links to the dashboard, the entities map, the project–entity network, and the projects UMAP. The flat screenshot of those cards is not used. The help popover on this page goes away.
- The index uses the `site` layout, the same chrome as `/how-to`: the ADAPTARIUM wordmark, language switcher, session control, menu button, overlay, and footer. It does not show the connected tab bar.
- On the dashboard, entities map, project–entity network, and projects UMAP, replace the old `SiteHeader` with that same top bar. Keep the connected tab bar under it. The visualizations, their page titles, and their colors stay.
- Spanish copy for the new heading follows the prototype line breaks. English and Italian are translations of that split. The lockup stays English in every locale. Counts keep coming from the existing Supabase query.
- Colors that are not an existing token are added under an `adapt-connected-` prefix: the hero blue measured from the photograph, the mint band, the figure blue, and the paper ground. Existing token hexes stay, including foam and aqua, which are nearby but not these swatches. A later cleanup can fold the prefixed tokens back into the main palette.

## Capabilities

### New Capabilities

- `connected-landing`: The `/connected` index shows the sea-glass hero, the mint introduction with live counts, and the four live entry cards, on the public-site layout, in en, es, and it.

### Modified Capabilities

- `site-navigation`: Connected routes adopt the public-site top bar. Explorer, article, admin, and pages still on the default layout keep the old header.
- `connected-navigation`: The tab bar remains the way to move between the four visualizations. The index does not show it.
- `connected-inner-header`: The connected layout renders the public-site top bar above the tab bar. The index does not use that layout.
- `site-design-tokens`: The palette gains four `adapt-connected-` colors. Existing ADAPTARIUM token values stay. The "connected pages look unchanged" scenario no longer applies to this landing or to the connected header.

## Impact

- `apps/web/app/pages/connected/index.vue` switches to the `site` layout and the new sections. `apps/web/app/layouts/connected.vue` swaps `SiteHeader` for `SiteTopBar` and mounts `SiteNavOverlay`. Dashboard, map, network, and UMAP pages stay on that layout.
- `apps/web/i18n/locales/{en,es,it}.json` split the index heading and the ways label. Card copy stays. The index help strings leave.
- `apps/web/public/img/adaptarium/connected-action.jpg` is the hero. `gemas-connected.png` is added beside it for the two shards under the introduction.
- `apps/web/app/assets/css/main.css` gains four color tokens inside `@theme`. Components use the generated utilities. No new component classes and no arbitrary hex utilities.
- No API, schema, or query changes. The four tool routes stay.
