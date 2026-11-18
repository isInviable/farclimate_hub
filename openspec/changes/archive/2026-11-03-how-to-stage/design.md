# Design

## Context

See proposal.md for motivation. `/how-to` is `pages/how-to.vue` with `layout: 'site'`, a blue header, and seven stacked steps. Copy and image paths come from `content/{en,es,it}/how-to.json` through `howToSchema` and `useHowToContent`. The site top bar is `h-14`. `StoneCta` already renders a label beside an image and links with `NuxtLinkLocale`. Palette utilities live in `main.css` under `@theme`.

The prototype is a Divi section, `100vh`, ground `#37a797`, with a fixed seven-column bar. Hover raises a 220px panel and crossfades `.base img`. Nothing starts selected. On a phone the bar's parent stays `position: fixed` with no width, so the cells collapse.

Screenshots `base-1.png` through `base-6.png` are in `public/img/adaptarium/capturas/` at 1980×971. `base-7.png` is absent there and returns 404 on the prototype host. `boton-9.png` is the text-free stone already used on the home. `boton-b.png` has Spanish words and a teal block painted in.

## Goals / Non-Goals

**Goals:**

- One stage component whose strings, image paths, and step order come from content.
- Two new color tokens, and no change to the hex of any existing token.
- Step 1 pinned on load. Hover previews only when the device can hover.

**Non-Goals:**

- Retinting blue, paper, aqua, teal, sand, or any other existing token.
- Restyling the top bar, overlay, footer, home, or navigation.
- Opening the prototype's JPG lightbox, or using `boton-b.png`.
- Clearing the selection by clicking the stage background.
- Rewriting step 4's duplicated sentence.

## Decisions

### 1. Two new tokens, everything else stays

Compare each designer hex to the current token of that role by RGB distance. At 15 or under, the current token is the same swatch and its hex stays. Above 15, and with no current token in that range, add a token.

| Designer hex | Nearest current token | Distance | Result |
|---|---|---|---|
| `#fc4b08` | orange `#fc4b08` | 0 | keep |
| `#024ec1` | blue `#0f4fc4` | 13.4 | keep blue |
| `#86592b` | brown `#86592b` | 0 | keep |
| `#fdbe0f` | yellow `#fdbe0f` | 0 | keep |
| `#bcd2d5` | mist `#bcd2d5` | 0 | keep |
| `#f7e7d8` | paper `#f8e8d9` | 1.7 | keep paper |
| `#2c2c2c` | ink `#2c2c2c` | 0 | keep |
| `#92c8b7` | aqua `#85cec4` | 19.3 | new `foam` |
| stage `#37a797` | teal `#249489` | 30.3 | new `sea` |

`#37a797` is 102 away from `#92c8b7`, so the stage is not the designer green. The prototype's brighter blue `#1b69e2` is 41 away from the current blue and 49 away from `#024ec1`; the bar uses the current blue, and no third blue is added. The prototype's brown `#9a6833` is 26 away from brown; the bar uses the designer brown that is already the token.

```css
--color-adapt-sea: #37a797;
--color-adapt-foam: #92c8b7;
```

`@theme` then exposes `bg-adapt-sea` and `bg-adapt-foam`. Home and navigation keep `bg-adapt-aqua` and `bg-adapt-blue`.

*Alternative*: move aqua to `#92c8b7` and blue to `#024ec1`. Rejected: those tokens paint the home, the stats band, and the menu, and both existing hexes are a different decision from this page.

### 2. Colors are assigned by step index

The component maps index 0–6 to full utilities written in source: `bg-adapt-brown`, `bg-adapt-paper`, `bg-adapt-yellow`, `bg-adapt-foam`, `bg-adapt-blue`, `bg-adapt-orange`, `bg-adapt-mist`. Content does not carry a color. Step titles and descriptions use `text-adapt-ink` on every cell, including blue and brown.

Introduction roles, all from content strings:

- Title lines: `font-adapt-title text-adapt-ink`
- Accent word: `font-adapt-heavy text-adapt-paper`
- Kicker lines: `font-adapt-keyword text-adapt-ink uppercase`
- Body: `font-adapt-body text-white`
- Emphasis phrase: `font-adapt-heavy text-adapt-ink` at body size. Actor has no bold, and the loaded heavy face is the black weight.
- Recipe word: `font-adapt-keyword text-adapt-yellow uppercase`

*Alternative*: a `tone` field in content, as on the home carousel. Rejected: the spec fixes this order, and a content edit should not be able to repaint step 4.

### 3. Content shape

Replace `hero` with `intro`. Keep `steps` and `cta`. `useHowToContent` stays; a missing locale still falls back to `how_to_en`.

```ts
intro: {
  titleLines: string[]
  accent: string
  kickerLines: string[]
  before: string
  emphasis: string
  middle: string
  recipe: string
  after: string
}
steps: {
  key: string
  title: string
  body: string
  image: string
  imageAlt: string
}[]
cta: { label: string, to: string, image: string }
```

The component prefixes the visible title with `${index + 1}.` and uppercases it. Content titles have no number.

Spanish `intro` and step bodies are the prototype copy, with the step 7 title stored as "Genera recursos". Step 4's `body` is the same sentence as step 3. English and Italian are translations of that Spanish and are provisional. Step images are `/img/adaptarium/capturas/base-1.png` through `base-6.png`, and `/img/adaptarium/capturas/base-7.png` for the last step. `cta.to` is `/explorer/`. `cta.image` is `/img/adaptarium/boton-9.png`.

*Alternative*: keep `hero.title` and `hero.intro` and split them in the component. Rejected: the introduction is six differently styled pieces, and one string cannot carry that.

### 4. One stage component

`pages/how-to.vue` keeps `layout: 'site'` and the SEO title, and renders `HowToStage`. The stage is `relative min-h-[calc(100dvh-3.5rem)] bg-adapt-sea`. The footer stays after it.

At `lg` and up, a two-column grid: introduction, then the screenshot (`object-contain`, max height the space above the bar). `StoneCta` sits at the top right of the stage with `appearance="light"` and `layout="stack"`. The bar is `absolute inset-x-0 bottom-0 grid grid-cols-7`. Each cell is a `button` about 90px tall. The shown cell grows a panel upward, about 220px, same background, title at the top, body in `font-adapt-body`. The panel overlays the screenshot. Closed cells show only the title, aligned to the bottom.

Below `lg` the pieces stack: introduction, screenshot, `StoneCta`, then the steps. From `md` to `lg` the steps are `grid-cols-2`; below `md` they are one column. The shown step grows in flow. There is no upward panel below `lg`.

The shown index is the hovered step when `(hover: hover) and (pointer: fine)` matches and the pointer is over a cell; otherwise it is the pinned index. Pinned starts at 0. Pointer enter and leave update the preview only in that media query. Click and keyboard set the pinned index. Arrow keys move the pinned index and focus that button. The body is rendered only for the shown step. The screenshot `alt` is that step's `imageAlt`.

Swapping the screenshot fades opacity over 250ms. `prefers-reduced-motion: reduce` swaps with no fade.

*Alternative*: leave the interaction in `pages/how-to.vue`. Rejected: the page file would own layout, focus, and the fade. The home keeps that kind of layout in section components.

### 5. Call to action stays `StoneCta`

`appearance="light"` is white text on the sea ground. The label comes from content, so English and Italian are not stuck inside a PNG. The link is the explorer route the spec already requires.

*Alternative*: ship `boton-b.png` as the whole control. Rejected: the words are Spanish and the link target is a JPG.

## Risks / Trade-offs

- [Ink on the blue and brown cells is low contrast] → Accepted. The prototype uses black on every cell. A later contrast pass can change the spec.
- [`base-7.png` 404s until the file is added] → The content path is in place. The other six screenshots work. Dropping the file in needs no code change.
- [Step 4 repeats step 3, and its screenshot has no callout] → Accepted. The sentence is edited in JSON when the real line exists.
- [English and Italian may be read as final] → Mark them provisional in the change summary.
- [The sea ground is a new token, so it will not match aqua sections on the home] → Intended. The two greens are different swatches.
- [A short laptop shows the raised panel over the introduction] → Same overlap as the prototype. The panel stays inside the stage and under the sticky top bar.
- [Hover plus click on a hybrid device can pin and then immediately preview] → Preview listeners attach only for the fine-hover media query. A tap only pins.

## Migration Plan

One deploy. The schema, the three content files, the tokens, and the component ship together. Rollback is reverting the commit. No database or API changes.

## Open Questions

None. The missing seventh screenshot does not change the page structure; the path is already chosen.
