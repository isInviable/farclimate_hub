## Context

The FarClimate Transformation HUB web app (`apps/web`) is a Nuxt 3 application using Nuxt UI, Tailwind CSS v4, and TypeScript. The existing `default` layout provides the site-wide `SiteHeader` (with transparent/overlay mode) and `SiteFooter`. The Figma handoff (node 296-3285) defines the exact visual requirements for the skills catalog page.

Current state: no skills page exists. Existing pages in `pages/` follow a consistent pattern: a single `.vue` page file using `<script setup lang="ts">` that imports components from `components/`.

## Goals / Non-Goals

**Goals:**
- Create a pixel-faithful implementation of the Figma skills page design
- Build reusable `SkillCard.vue` so cards are never duplicated
- Structure dummy data as typed interfaces ready for CMS/Nuxt Content replacement
- Use Nuxt UI primitives (`UCheckbox`, `UButton`, `UInput`) where they map to design elements
- Use existing Tailwind design tokens (`neutral-darkest`, `font-display`, `font-mono`, etc.)

**Non-Goals:**
- Real CMS integration or data fetching (out of scope for this change)
- Routing/navigation wiring for the skills nav link (already present in `SiteHeader`)
- Mobile/responsive breakpoints beyond basic layout (Figma shows desktop 1280px)
- Actual filter logic (checkboxes are visual-only for now)

## Decisions

### Decision 1: Component decomposition
Split the page into 4 focused components under `components/skills/`:
- `SkillsHero.vue` — hero section with background image + overlay + text
- `SkillsFilterSidebar.vue` — left sidebar filter panel
- `SkillCard.vue` — single card, accepts a typed `SkillItem` prop
- `SkillsGrid.vue` — receives an array of `SkillItem[]` and renders a 2-col grid of `SkillCard`

**Why**: Keeps `skills.vue` thin (orchestration only). Cards in isolation are testable and reusable.

### Decision 2: Dummy data location
Define dummy data as a `const skills: SkillItem[]` array directly in `skills.vue` with a typed interface exported from a composable-style file `composables/useSkillsData.ts`.

**Why**: Makes the swap to CMS/Nuxt Content a one-line change (`useFetch` or `queryContent`) without touching component props.

### Decision 3: Use `default` layout with `SiteHeader mode=true`
The hero overlaps the nav, matching the design's transparent header with gradient-to-top overlay.

### Decision 4: Images from `/img/skills/`
The Figma export wrote images to `apps/web/public/img/skills/`. Reference them via `/img/skills/<hash>.png` paths in dummy data.

### Decision 5: Nuxt UI for interactive elements
Use `UCheckbox` for sidebar filters and `UButton` for the card CTA. The button style (dark bg + olive-green icon block) requires a custom slot/class override since it doesn't map directly to a Nuxt UI variant — wrap `UButton` with custom classes or use a plain `<button>` with Tailwind for the split-button pattern.

## Risks / Trade-offs

- [Hash-named images] Filenames are content-hash based; if Figma exports change, image refs break → Mitigation: these are dummy assets; CMS will provide real URLs
- [Filter non-functional] Checkboxes render but don't filter the grid yet → Mitigation: acceptable for a dummy page; add reactive filtering when CMS integration lands
- [Font loading] "Outfit" and "Martian Mono" must be loaded; they appear to already be imported in the project → Mitigation: verify via `nuxt.config.ts` Google Fonts module
