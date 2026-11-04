# Spec Delta

## Purpose

Defines the public stories index and each story article: a sea-glass poster of four portraits, and one shared Alfonso article used as placeholder copy.

## ADDED Requirements

### Requirement: Stories index route
The site SHALL serve the stories index at `/stories`, `/es/stories`, and `/it/stories`.

#### Scenario: Open the index
- **WHEN** a visitor opens `/stories`
- **THEN** the poster is shown and the previous card list is not

### Requirement: Index hero
The index hero SHALL show the sea-glass photograph, a stacked wordmark, the subtitle, and three paragraphs. Those strings SHALL be the template's Spanish copy and SHALL be identical in en, es, and it.

#### Scenario: Hero copy
- **WHEN** the index renders in any locale
- **THEN** the wordmark reads as the stacked lines HIS, TO, and RIAS, the subtitle is "detrás de las recetas", and the paragraphs include "Descubre estas experiencias en la voz de sus protagonistas."

### Requirement: Four portrait columns
The index SHALL list exactly four stories, in content order, as equal columns. Each column SHALL show the person's first name, one line, and a portrait, and activating the column SHALL open that story in the current locale.

#### Scenario: Four links
- **WHEN** the index renders
- **THEN** the columns are Gabriella, María, Lorena, and Joana, linking to `water-smart-agriculture-extremadura`, `sustainable-fisheries-galicia`, `restoring-forest-resilience`, and `agriculture-adaptation-europe`

#### Scenario: Open a story
- **WHEN** the visitor activates the Lorena column on the Spanish index
- **THEN** the Spanish story route for `restoring-forest-resilience` opens

### Requirement: Portrait cycle
Column portraits and name colors SHALL be assigned by position, not by the story file. Positions 1 and 4 SHALL use the basket portrait and orange. Position 2 SHALL use the rain-jacket portrait and teal. Position 3 SHALL use the woman-with-clipboard portrait and yellow.

#### Scenario: Repeated portrait
- **WHEN** the index renders
- **THEN** the first and fourth columns show the same basket portrait

### Requirement: Narrow index
Below 1024px the hero copy SHALL sit in one column over the photograph, and the four portraits SHALL stack in the same order.

#### Scenario: Phone
- **WHEN** the index is opened on a 390px-wide viewport
- **THEN** the four columns appear one under another, Gabriella first

### Requirement: Story article
Each of the four stories SHALL show the same Alfonso article. The kitchen-sink story SHALL keep its component showcase. An unknown slug SHALL respond as not found.

#### Scenario: Shared article
- **WHEN** a visitor opens `water-smart-agriculture-extremadura` and then `agriculture-adaptation-europe`
- **THEN** both pages show the same Alfonso article and neither shows "Content coming soon."

#### Scenario: Kitchen sink unchanged
- **WHEN** a visitor opens the kitchen-sink story
- **THEN** the component showcase is shown and the Alfonso article is not

#### Scenario: Missing story
- **WHEN** a visitor opens a story slug that has no content file
- **THEN** the response is not found

### Requirement: Article regions
The article SHALL show, in order: a two-panel hero, an aqua identity-and-questions band, a full-bleed quote over the forest photograph, a Proyecto and Metodología band that includes an audio clip, then Ponderación and Resultados. The hero's left panel SHALL show the basket portrait with the stacked wordmark and "detrás de las recetas". The right panel SHALL show the roadside scene with the name and the harvest line.

#### Scenario: Hero panels
- **WHEN** a story article renders
- **THEN** the right panel shows "Alfonso" and "La cosecha que cada invierno cambia con el mundo."

#### Scenario: Later bands
- **WHEN** the visitor reads past the hero
- **THEN** the page shows "Combatir y construir", "ALFONSO SARMIENTO", "Director de extinción", "Galicia", "¿adaptación o transformación?", "METODOLOGÍA", "PONDERACIÓN", and "RESULTADOS"

### Requirement: Placeholder copy
The article strings SHALL be the template's Spanish text, including its placeholder paragraphs, and SHALL be identical in en, es, and it and on every one of the four stories.

#### Scenario: Same sentence in English
- **WHEN** the article renders on the English site
- **THEN** the first answer begins "Lorem ipsum dolor sit amet, consectetuer adipiscing elit." and a pull quote contains "Quisque rutrum."

### Requirement: Audio clip
The Metodología band SHALL include a playable audio clip titled "diagnosticar los problemas y sus causas", served from the site and not from the template host.

#### Scenario: Play
- **WHEN** the visitor starts the clip
- **THEN** audio plays from a file hosted with the site
