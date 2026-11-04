# Tasks

## 1. Palette tokens

- [x] 1.1 Add `--color-adapt-sea: #37a797` and `--color-adapt-foam: #92c8b7` to the ADAPTARIUM block in `apps/web/app/assets/css/main.css`. Verify those two variables are present and that orange `#fc4b08`, blue `#0f4fc4`, teal `#249489`, brown `#86592b`, yellow `#fdbe0f`, mist `#bcd2d5`, sand `#eeeadf`, ink `#2c2c2c`, aqua `#85cec4`, and paper `#f8e8d9` are unchanged.

## 2. How-to stage

- [ ] 2.1 Replace `howToSchema` with `intro`, `steps` (no color field), and `cta` as in design.md, and fill `content/{es,en,it}/how-to.json`. Spanish copy is the prototype text, step 4 repeats step 3, the seventh title is "Genera recursos", images are `base-1.png` through `base-7.png` under `/img/adaptarium/capturas/`, and the call to action uses `boton-9.png` with `to` `/explorer/`. English and Italian are translations of that Spanish. Verify `pnpm typecheck` in `apps/web` passes.
- [x] 2.2 Create `HowToStage` and render it from `pages/how-to.vue` (`layout: 'site'`). Map step index to `bg-adapt-brown`, `bg-adapt-paper`, `bg-adapt-yellow`, `bg-adapt-foam`, `bg-adapt-blue`, `bg-adapt-orange`, and `bg-adapt-mist`. Pin step 1 on load, preview on hover only for `(hover: hover) and (pointer: fine)`, pin on click and arrow keys, fade the screenshot unless reduced motion is set, and use `StoneCta` with `appearance="light"` and `layout="stack"`. Verify at 1280px: the ground is `#37a797`, seven cells sit on the bottom in that color order, step 1 is open on `base-1.png`, hovering step 4 shows `#92c8b7` and `base-4.png` and leaving returns to step 1, activating step 6 keeps it after the pointer leaves, ArrowRight from step 1 pins step 2, and the call-to-action label is a text node.
- [x] 2.3 Verify the narrow layout in the browser: at 390px the introduction, screenshot, call to action, and steps are one column with no horizontal scroll and the active step shows its paragraph; at 800px the steps are two columns. In a mobile emulation where hover is unavailable, tapping step 3 pins it and does not show another step's image during the tap.
- [x] 2.4 Open `/how-to`, `/es/how-to`, and `/it/how-to`. Verify each shows that locale's accent word and step 1 title, the Spanish titles are Busca, Visualiza, Profundiza, Analiza, Inicia sesión, Mesa de proyectos, and Genera recursos, and activating the call to action opens the explorer in that locale. Change the English step 3 image path, reload, confirm the new image appears only while step 3 is active, then restore the path. Confirm step 7's image address is `/img/adaptarium/capturas/base-7.png`.
- [x] 2.5 Run `pnpm build` in `apps/web` and verify it emits prerendered HTML for `/how-to`, `/es/how-to`, and `/it/how-to` containing each locale's accent word.

## 3. Surrounding pages

- [x] 3.1 On the how-to page, verify the top bar and overlay still open and the footer is reachable below the stage without the step bar covering it. On the home page, verify the recipe section is still `bg-adapt-aqua` (`#85cec4`) and not sea or foam.

## Workflow follow-up

- Archive the change after review.
