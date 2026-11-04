# Design

## Context

See proposal.md for motivation. The home already renders `HomeHero` and `HomeStats` from `content/{en,es,it}/home.json` through `homeSchema` and `useHomeContent`. Palette utilities (`bg-adapt-aqua`, `bg-adapt-blue`, `bg-adapt-yellow`, `text-adapt-orange`, the four `font-adapt-*` families) and `StoneCta` already exist. `StoneCta` always paints its label orange. Nuxt UI v4 provides `UCarousel` (Embla) with `arrows`, `dots`, and `loop`.

Images in `public/img/adaptarium/` that this change uses:

- `aqua-3.png` — stone pile, opaque aqua ground that is not `--color-adapt-aqua`
- `paisaje-1.jpg`, `paisaje-2.jpg`, `paisaje-3.jpg` — carousel photographs, already duotone
- `boton-azul-ceramica-3.jpg`, `boton-amarillo-vidrio-1.jpg`, `boton-aqua-ceramica-1.jpg` — carousel stones, each a JPEG with its own background
- `historias-home-1.jpg` — stories photograph, dark field on the left, portrait on the right
- `historias-boton-2.png` — stories stone cluster, RGBA, text removed; an opaque blue halo remains
- `boton-9.png` — provisional recipe call-to-action image (transparent, teal glow)

## Goals / Non-Goals

**Goals:**

- Three new home sections whose every string and image path is content.
- Backgrounds taken only from existing palette utilities, so a baked-in image background stays visible until a transparent file replaces it.

**Non-Goals:**

- New palette tokens, or CSS colors sampled from image pixels.
- Knocking out backgrounds in code.
- Linking a carousel card to a specific solution. Cards are copy only.
- Autoplay.
- Footer, header, explorer, or connected changes.

## Decisions

### 1. Extend `homeSchema`; keep one collection per locale

Add `recipe`, `inspire`, and `stories` to the existing object. `useHomeContent` stays as it is. A missing locale still falls back to `home_en`.

```ts
recipe: {
  kicker: string          // "Cada"
  title: string           // "RECETA"
  lead: string            // "presenta"
  count: string           // "15" — editable string, not derived
  body: string
  image: string
  imageAlt: string
  groups: { title: string, items: string[] }[]
  cta: { label: string, to: string, image: string }
}
inspire: {
  slides: {
    image: string
    imageAlt: string
    title: string
    card: {
      kicker: string
      body: string
      tone: 'blue' | 'yellow' | 'aqua'
      image: string
      imageAlt: string
    }
  }[]
}
stories: {
  image: string
  imageAlt: string
  lines: string[]
  cta: { label: string, to: string, image: string }
}
```

- `tone` is an enum, not a class string. The component maps it to a full utility written literally in the source (`bg-adapt-blue`, `bg-adapt-yellow`, `bg-adapt-aqua`) so Tailwind can see it.
- Spanish copy starts from the prototype. English and Italian are translations of that copy and are provisional.
- Recipe link `to` is `/explorer/`. Stories link `to` is `/stories`. Both go through `NuxtLinkLocale` inside `StoneCta`.
- Recipe `cta.image` is `/img/adaptarium/boton-9.png` until a dedicated cluster arrives. Replacing it is a content edit.

*Alternative*: a second content collection for the new sections. Rejected: the page is one document, and the fallback already works on `home.json`.

### 2. Palette grounds, images as stored

- Recipe section: `bg-adapt-aqua`. The pile is an `<img>` with `object-contain`. Its own aqua rectangle will show against `#85cec4`. That rectangle is the signal to swap in a transparent PNG later; do not retint the section to match the file.
- Carousel cards: `tone` maps to `bg-adapt-blue`, `bg-adapt-yellow`, `bg-adapt-aqua`. Stone JPEGs are rendered as-is inside the card.
- Stories: the photograph is the ground. No extra color panel behind it. The stone PNG sits beside the HTML label; its blue halo stays visible.
- No new entries in `main.css`.

*Alternative*: set each card to the sampled JPEG background so the stone sits flush. Rejected: the user asked for palette colors, and a visible mismatch is how a later transparent file gets noticed.

### 3. Components

In `app/components/home/`:

- `HomeRecipe`. Below `lg`, one column: lead, groups, pile, `StoneCta`. At `lg`, a grid with the pile in the center and the four groups around it. Connector lines are borders on the group columns at `lg` only. Group boxes are white with an `border-adapt-ink` outline; the count uses `font-adapt-heavy text-adapt-orange`.
- `HomeInspire`. `UCarousel` with the slides array, `loop`, `dots`, and `arrows`. `ui.item` is `basis-full`. Arrow buttons use `hidden lg:inline-flex` via `ui.prev` and `ui.next`, and a light button style so they stay visible on the photographs. Each slide is `relative min-h-[36rem] lg:min-h-[70vh]` with the photograph `absolute inset-0 object-cover`. Title sits on the photo (`font-adapt-heavy`). The card sits below the title on small screens and on the right from `lg`, text centered, kicker in `font-adapt-keyword`.
- `HomeStories`. Photograph `absolute inset-0 h-full w-full object-cover object-left`. Section is `min-h-[32rem]` below `lg` and `aspect-[1536/816]` from `lg`, so the full frame shows on desktop and the dark left of the file stays under the heading on a phone. Heading lines in `font-adapt-heavy text-white`. `StoneCta` under the heading.

`pages/index.vue` renders the three components between `HomeStats` and the layout footer.

### 4. `StoneCta` gains an appearance

Add an optional `appearance` prop, `'orange' | 'light'`, default `'orange'`. `light` uses `text-white`. The hero keeps the default. Recipe and stories pass `light`. The label stays a `<span>` next to the image. Nothing in this change puts words into an image.

*Alternative*: a second component. Rejected: the only difference is the label color.

## Risks / Trade-offs

- [Opaque pile, stone JPEGs, and the stories halo look unfinished] → Accepted. Same path in content; dropping a transparent file in place needs no code change. Do not paper over the seam with a sampled color.
- [`aqua-3.png` is 836px wide and will look soft if stretched] → `object-contain` at a capped width. Do not use it as a full-bleed background.
- [`historias-home-1.jpg` is 1536px wide and will look soft on a large desktop] → Acceptable until a 2x export arrives. The section uses the file's aspect ratio so it is not cropped on desktop.
- [English and Italian copy may be read as final] → Mark it provisional in the change summary. Editors change it in the JSON.
- [A `tone` value outside the three enums fails content validation] → Zod enum. The component's map still has a branch for each enum member.
- [Carousel arrows hidden with a utility might still be focusable] → Use the responsive `hidden lg:inline-flex` on the button class so they are `display: none` below `lg`, which removes them from focus order.
- [Schema change fails the build if one locale file is stale] → Update `en`, `es`, and `it` in the same task and run the build.

## Migration Plan

One deploy. Content files and components ship together. Rollback is reverting the commit. No database or API changes.

## Open Questions

None. The phone keeps the recipe solutions link; the prototype hides it, and the spec requires it.
