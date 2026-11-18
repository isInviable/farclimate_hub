# Proposal

## Why

The public about page is the last section still on the old editorial layout. Home, how-to, stories, skills, and networking already use the ADAPTARIUM design and the shared site chrome. The about page should match the approved reference layout and retire the copy that layout replaces.

## What Changes

- Rebuild `/about` as three bands that follow the reference page: an aqua hero ("Sobre el proyecto" / stacked "Transformation" / "Hub" beside the sea-glass photograph), a paper band with "¿Qué es?", "¿Qué no es?", "¿Qué queremos?", and "¿Para quién es esta página?", and a yellow band pairing the metaphor photograph with "Una solución" / "Una receta" / "Vidrios marinos".
- Take the Spanish wording from the reference page, including the lowercase "queremos" and the capitalized "SOLUCIONES" in the sea-glass paragraph. Translate that copy into English and Italian in the same voice as the home and how-to content. There is no separately approved translation.
- Serve the page on the site layout, so it shows the same top bar, overlay navigation, and footer as how-to. The "About us" item stays in the navigation and is marked active on this route.
- Replace the markdown about documents and their figure and sector-grid blocks with per-locale structured content. Remove those components and the retired page copy. Leave `header.about`: the default header still uses it on pages that have not moved.
- The page has no call to action. The reference page has none.

## Capabilities

### New Capabilities

- `about-page`: The public about page: its route, three-band layout, localized copy and images, and the removal of the previous editorial about content.

### Modified Capabilities

- `site-navigation`: The about page leaves the "keeps the previous header" exception and uses the public-site top bar, overlay, and footer. The active-section rule covers this route.
- `site-design-tokens`: The scenario that cites the about page as a page still rendered with the pre-ADAPTARIUM tokens no longer applies to about. Token values themselves do not change.

## Impact

- `apps/web/app/pages/about.vue` switches from the default layout to the site layout.
- Content moves from `apps/web/content/{en,es,it}/about.md` to structured locale files, with the content schema and `useAboutContent` updated to match.
- `AboutFigure.vue` and `AboutSectorGrid.vue` are removed, along with the copy that only those blocks rendered.
- Images already in `apps/web/public/img/adaptarium/about/` (`gemas-aqua.png`, `gemas-h.png`, `quienes-somos-metafora.png`).
- About joins the statically prerendered public routes, as how-to does.
- `openspec/specs/site-navigation` and `openspec/specs/site-design-tokens` scenarios that still describe the old about page are updated by this change's deltas.
