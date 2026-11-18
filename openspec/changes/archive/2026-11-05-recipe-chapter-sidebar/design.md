# Design

## Context

`ArticleViewAI` renders the recipe for both page and modal chrome. The sidebar is `ArticleSectionNav`: a flat list of `{ id, label }` with a numeric prefix and one active index. `useArticleRecipe` builds the visible canonical sections from `RECIPE_SECTION_KEYS`, skipping empty strings. `ArticleViewAI` then wraps that list as Summary+, sections, Map last, and scroll-spies with `data-recipe-segment-index`.

`ArticleStructuredView` copies the same key list and is not mounted. The sea-glass files already live under `apps/web/public/img/adaptarium/receta/`. `12-icono-politicas-politicas.png` is the public-policies image; leave the filename as published. The commented `RECIPE_SECTION_IMAGES` block in `ArticleViewAI` is a different, unused body decoration.

See proposal.md for why the order changes. Behavior is in the two delta specs.

## Goals / Non-Goals

**Goals:**

- One ordered segment list shared by the sidebar and the scroll column: Resumen, Ubicación, then canonical sections in the new key order.
- Sidebar chapters derived from that list, with titles that are not controls and are absent from the article.
- A unit-tested group builder, so omission and order do not depend on mounting the page.

**Non-Goals:**

- Chapter banners, sea-glass images, or legend text colors inside the article.
- A mobile replacement for the sidebar (it stays hidden below `lg`).
- Renaming recipe keys, changing `/api/document-recipe`, or editing pipeline data.
- Restyling primary tabs, pins, chat, or contacts.
- Turning nav rows into `UButton`. The glass photos are not Iconify icons, and `UButton` chrome fights a long text list. Existing `UAlert` empty and error states stay.

## Decisions

1. **Canonical order lives in `RECIPE_SECTION_KEYS`.** New order: `context_summary`, `policy_context`, `legal_aspects`, `challenges`, `objectives`, `who_is_involved`, `implementation_phases`, `economic_data`, `solutions_implemented`, `benefits`, `lessons_learnt`, `success_and_limiting`, `transferability`. Copy the same array into `ArticleStructuredView` so the unused view cannot resurrect the old order. Do not invent a second sort at render time.

2. **Segments are a flat list; chapters are a view of it.** `ArticleViewAI` builds segments as Resumen (`summary-plus`), Ubicación (`map`), then `visibleSections`. The map block in the template moves to sit directly after the summary block, and `mapSegmentIndex` becomes `1`. Body headings keep `segmentNumber(index)` (`01.`, `02.`, …). No chapter element is added to the scroll column.

3. **A pure builder produces the sidebar groups.** Add a function, colocated with the recipe composable, that takes the flat segments and returns only chapters that have items:

   - `introduction`: `summary-plus`, `map` (always)
   - `startingPoint`: the four Situación keys, in key order, if any are visible
   - `howItWasDone`: the four Cómo se hizo keys, if any are visible
   - `whatWasAchieved`: the five Qué se logró keys, if any are visible

   Each item carries `id`, `label`, `image` (public path), and the flat segment index used by today's click and scroll-spy. Chapter ids are not segment indexes. Alternative considered: store chapters in the DOM and spy on headings. Rejected because the article must not contain those headings.

4. **`ArticleSectionNav` renders groups.** Props become the chapter list plus the active flat index. Each chapter is a heading (`p` or `h2`, not a button) and a nested list of buttons. The button emits the item's flat index. Active row keeps the current semibold treatment. The image is `<img alt="">` at a small fixed size (`object-contain`); the visible label remains the accessible name. Text color stays `text-neutral-600` / `text-neutral-darkest`. Labels wrap; they are not truncated. The aside gets `min-h-0` and `overflow-y-auto` so the list scrolls inside the already `overflow-hidden` grid without moving `.recipe-scroll-stack`.

5. **Copy is i18n, not hardcoded poster text.** Update `es`, `en`, and `it`.

   | Key | es | en | it |
   |---|---|---|---|
   | chapter introduction | Introducción | Introduction | Introduzione |
   | chapter starting point | Situación de partida | Starting point | Situazione di partenza |
   | chapter how | Cómo se hizo | How it was done | Come è stato fatto |
   | chapter achieved | Qué se logró | What was achieved | Cosa si è ottenuto |
   | summary (replace `summaryPlus`) | Resumen | Summary | Sintesi |
   | map | Ubicación | Location | Località |
   | `context_summary` | Breve contexto | Brief context | Breve contesto |
   | `policy_context` | Políticas públicas | Public policies | Politiche pubbliche |
   | `legal_aspects` | Aspectos legales | Legal aspects | Aspetti legali |
   | `challenges` | Retos | Challenges | Sfide |
   | `objectives` | Objetivos | Objectives | Obiettivi |
   | `who_is_involved` | Quién participa | Who is involved | Chi partecipa |
   | `implementation_phases` | Fases de implementación | Implementation phases | Fasi di attuazione |
   | `economic_data` | Datos económicos | Economic data | Dati economici |
   | `solutions_implemented` | Soluciones implementadas | Solutions implemented | Soluzioni attuate |
   | `benefits` | Beneficios | Benefits | Benefici |
   | `lessons_learnt` | Lecciones aprendidas | Lessons learnt | Lezioni apprese |
   | `success_and_limiting` | Factores de éxito y limitantes | Success and limiting factors | Fattori di successo e limitanti |
   | `transferability` | Transferibilidad | Transferability | Trasferibilità |

   The sidebar prefixes 1, 2, and 3 on the last three chapter titles. Introducción has no prefix.

6. **Image map** (decorative `src`):

   | id | file |
   |---|---|
   | `summary-plus` | `13-icono-resumen.png` |
   | `map` | `03-icono-ubicacion.png` |
   | `context_summary` | `14-icono-breve-contexto.png` |
   | `policy_context` | `12-icono-politicas-politicas.png` |
   | `legal_aspects` | `15-icono-aspectos-legales.png` |
   | `challenges` | `08-icono-retos.png` |
   | `objectives` | `02-icono-objetivos.png` |
   | `who_is_involved` | `07-icono-quien-participa.png` |
   | `implementation_phases` | `10-icono-fases-de-implementacion.png` |
   | `economic_data` | `05-icono-datos-economicos.png` |
   | `solutions_implemented` | `16-icono-soluciones-implementadas.png` |
   | `benefits` | `11-icono-beneficios.png` |
   | `lessons_learnt` | `09-icono-lecciones-aprendidas.png` |
   | `success_and_limiting` | `04-icono-factores-de-exito-y-limitantes.png` |
   | `transferability` | `06-icono-transferibilidad.png` |

   Base path: `/img/adaptarium/receta/`.

## Risks / Trade-offs

- [Risk] Moving the map in the template but leaving `mapSegmentIndex` at the end makes the spy highlight the wrong row. → Set the index to `1` and keep DOM order identical to the flat segment list.
- [Risk] The grid item's default `min-height: auto` swallows `overflow-y-auto`, so the bottom chapters stay unreachable. → Put `min-h-0` and `overflow-y-auto` on the aside, and check a full 15-row recipe in the browser.
- [Risk] Long labels (`Factores de éxito y limitantes`) overflow the one-column aside. → Wrap, do not truncate, and let the sidebar scroll.
- [Trade-off] `ArticleStructuredView` is updated even though nothing mounts it, to keep a single key order in the repo.

## Migration Plan

No data migration. Ship with the web app. Rollback is reverting the web commit. Readers see the new order and labels immediately.

## Open Questions

None. English and Italian chapter wording above is the chosen copy for the spec scenarios.
