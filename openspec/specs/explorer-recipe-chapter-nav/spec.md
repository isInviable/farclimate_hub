# explorer-recipe-chapter-nav Specification

## Purpose

The article recipe is read as four chapters. The sidebar names those chapters and each section; the scrolling article follows the same order and does not repeat the chapter titles.

## Requirements

### Requirement: Chapter titles stay in the sidebar
The recipe sidebar SHALL show four chapter titles in this order: Introducción, Situación de partida, Cómo se hizo, Qué se logró. Introducción SHALL be unnumbered. The other three SHALL be numbered 1, 2, and 3. A chapter title SHALL be text, not a button or link. The scrolling article SHALL NOT show these titles.

#### Scenario: Titles are only in the sidebar
- **WHEN** the reader opens the recipe
- **THEN** the sidebar shows the four chapter titles and the scrolling article does not contain them

#### Scenario: A chapter title does not scroll
- **WHEN** the reader activates a chapter title
- **THEN** the article does not scroll and the title is not a control

### Requirement: Resumen then Ubicación then canonical sections
The sidebar and the scrolling article SHALL list Resumen, then Ubicación, then the visible canonical sections in the `explorer-structured-recipe` order. Resumen is the summary lead. Ubicación is the map.

#### Scenario: Full recipe
- **WHEN** every canonical section has text
- **THEN** Ubicación is the second segment and the canonical sections follow it in the required key order

#### Scenario: Map stays present without points
- **WHEN** the case study has no map points
- **THEN** Ubicación still appears under Introducción, directly after Resumen

### Requirement: Situación de partida membership
The Situación de partida chapter SHALL contain only the visible sections `context_summary`, `policy_context`, `legal_aspects`, and `challenges`, in that order.

#### Scenario: Challenges follows legal aspects
- **WHEN** all four Situación sections have text
- **THEN** they appear in that order under Situación de partida

### Requirement: Cómo se hizo membership
The Cómo se hizo chapter SHALL contain only the visible sections `objectives`, `who_is_involved`, `implementation_phases`, and `economic_data`, in that order.

#### Scenario: Objectives precedes who is involved
- **WHEN** all four Cómo se hizo sections have text
- **THEN** they appear in that order under Cómo se hizo

### Requirement: Qué se logró membership
The Qué se logró chapter SHALL contain only the visible sections `solutions_implemented`, `benefits`, `lessons_learnt`, `success_and_limiting`, and `transferability`, in that order.

#### Scenario: Success factors follow lessons
- **WHEN** all five Qué se logró sections have text
- **THEN** `success_and_limiting` follows `lessons_learnt` under Qué se logró

### Requirement: Empty chapters are omitted
A canonical section whose text is missing or whitespace SHALL be omitted from the sidebar and from the article. A chapter whose canonical sections are all omitted SHALL be omitted, title included. Introducción SHALL remain because Resumen and Ubicación always remain.

#### Scenario: Middle chapter has no text
- **WHEN** only `context_summary` and `benefits` have text
- **THEN** the sidebar shows Introducción, Situación de partida with only the brief-context entry, and Qué se logró with only the benefits entry, and it does not show Cómo se hizo

### Requirement: Sea-glass image on each row
Each sidebar row SHALL show that entry's sea-glass image from `/img/adaptarium/receta/` and SHALL NOT show an item number. The scrolling article SHALL NOT show those images. The image SHALL be decorative. The text label SHALL be the accessible name.

#### Scenario: Images replace item numbers
- **WHEN** the sidebar renders Resumen, Ubicación, and `context_summary`
- **THEN** those rows show `13-icono-resumen.png`, `03-icono-ubicacion.png`, and `14-icono-breve-contexto.png`, and none of the rows shows an item number
- **THEN** the article body does not show those three images

#### Scenario: Remaining section images
- **WHEN** the sidebar renders the other canonical sections
- **THEN** the rows show `12-icono-politicas-politicas.png` for `policy_context`, `15-icono-aspectos-legales.png` for `legal_aspects`, `08-icono-retos.png` for `challenges`, `02-icono-objetivos.png` for `objectives`, `07-icono-quien-participa.png` for `who_is_involved`, `10-icono-fases-de-implementacion.png` for `implementation_phases`, `05-icono-datos-economicos.png` for `economic_data`, `16-icono-soluciones-implementadas.png` for `solutions_implemented`, `11-icono-beneficios.png` for `benefits`, `09-icono-lecciones-aprendidas.png` for `lessons_learnt`, `04-icono-factores-de-exito-y-limitantes.png` for `success_and_limiting`, and `06-icono-transferibilidad.png` for `transferability`

### Requirement: Poster labels in each locale
Sidebar chapter titles and segment labels SHALL use the poster vocabulary in Spanish, English, and Italian. Resumen SHALL NOT keep the trailing plus. `context_summary` SHALL read as brief context, and `policy_context` SHALL read as public policies.

#### Scenario: Spanish labels
- **WHEN** the locale is Spanish and every segment is visible
- **THEN** the chapters read Introducción, 1. Situación de partida, 2. Cómo se hizo, and 3. Qué se logró
- **THEN** the segments read Resumen, Ubicación, Breve contexto, Políticas públicas, Aspectos legales, Retos, Objetivos, Quién participa, Fases de implementación, Datos económicos, Soluciones implementadas, Beneficios, Lecciones aprendidas, Factores de éxito y limitantes, and Transferibilidad

#### Scenario: English and Italian drop the plus
- **WHEN** the locale is English
- **THEN** the first segment reads Summary, the chapters read Introduction, 1. Starting point, 2. How it was done, and 3. What was achieved, and `context_summary` reads Brief context
- **WHEN** the locale is Italian
- **THEN** the first segment reads Sintesi, the chapters read Introduzione, 1. Situazione di partenza, 2. Come è stato fatto, and 3. Cosa si è ottenuto, and `context_summary` reads Breve contesto

### Requirement: Sidebar list scrolls on its own
When the chapter list is taller than the recipe column, the sidebar SHALL scroll inside itself. Scrolling the sidebar SHALL NOT scroll the article, and scrolling the article SHALL NOT scroll the sidebar.

#### Scenario: Long chapter list
- **WHEN** every segment is visible and the list is taller than the column
- **THEN** the reader can scroll the sidebar to Transferibilidad without moving the article

### Requirement: The active row follows the article
The sidebar SHALL mark the segment at the top of the article view. Activating a row SHALL scroll that segment to the top of the article. Segment headings in the article SHALL keep a single sequence of numbers in this same order.

#### Scenario: Scroll updates the mark
- **WHEN** the reader scrolls from Resumen to `objectives`
- **THEN** the sidebar mark moves to Objetivos and does not mark a later chapter first

#### Scenario: Row activation
- **WHEN** the reader activates Transferibilidad
- **THEN** the article scrolls to that segment and the sidebar marks it
