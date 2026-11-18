# Proposal

## Why

The public home stops after the hero and the stats band. The ADAPTARIUM prototype continues with the recipe diagram, the "Inspírate" carousel, and the stories call to action, and those three sections are what a visitor sees before the footer. The first redesign change left them out on purpose so the identity and the first two sections could land first.

## What Changes

- Add three sections to the home, after the stats band and before the footer: the recipe diagram, the inspiration carousel, and the stories call to action.
- Keep every visible string (headings, the "15", group labels, slide titles, card copy, button labels) and every image path in the per-locale Nuxt Content files. Copy may be rewritten later without touching components.
- Draw section and card backgrounds from the existing ADAPTARIUM palette. Sea-glass images that still carry their own background are rendered as delivered, so a mismatched rectangle shows where a future transparent file must replace the current one.
- Button labels are HTML next to the stone image. No button image contains text. The stories stone cluster is `historias-boton-2.png` (text already removed). The blue-slide stone is `boton-azul-ceramica-3.jpg`.
- On viewports below 1024px the diagram stacks, the carousel hides its arrows and keeps its dots, and the stories text sits over the photograph. The recipe "Entrar a soluciones" link stays visible on the phone (the prototype hides it).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `home-page`: The page order grows from hero and stats to include the recipe diagram, the inspiration carousel, and the stories call to action. Responsive behavior covers those sections. New requirements cover their content, palette backgrounds, and text-free button images. Localized content and prerender stay as they are.

## Impact

- `apps/web/content/{en,es,it}/home.json` and `homeSchema` in `apps/web/content.config.ts`.
- New home components for the three sections, plus a text-color variant on `StoneCta` so the recipe and stories labels can be light on a colored ground. The hero keeps its orange label.
- `apps/web/app/pages/index.vue` renders the new sections. Layout, navigation, footer, explorer, and connected stay as they are.
- Images already in `apps/web/public/img/adaptarium/`. The recipe call to action uses `boton-9.png` until a dedicated cluster is delivered; swapping it is a content-path change.
