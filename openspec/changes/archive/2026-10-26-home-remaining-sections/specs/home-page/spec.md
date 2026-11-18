# Spec Delta

## MODIFIED Requirements

### Requirement: Home sections
The home page SHALL consist of, in order, the hero section, the stats section, the recipe diagram, the inspiration carousel, the stories call to action, and the site footer. The retired editorial sections (sector grid, why this matters, and platform steps) SHALL no longer be shown.

#### Scenario: Page structure
- **WHEN** a user opens the home page
- **THEN** they see the hero, the stats band, the recipe diagram, the inspiration carousel, the stories call to action, and the footer, and none of the retired editorial sections

### Requirement: Responsive layout
Below 1024px the hero SHALL stack wordmark, sea-glass image, intro, and call to action in a single column, the stats block SHALL span the content width, the recipe diagram SHALL stack its groups, stone pile, and solutions link in one column, the carousel SHALL show one full-bleed slide with dots and without arrows, and the stories heading and link SHALL sit over the photograph.

#### Scenario: Phone layout
- **WHEN** the home is opened on a 390px-wide viewport
- **THEN** no horizontal scrolling occurs, every hero element is visible in one column, and the recipe solutions link is visible below the stone pile

### Requirement: Localized editable content
All home texts, figures, and image references SHALL come from per-locale content files (en, es, it); a locale without a home file SHALL fall back to English.

#### Scenario: Edit a figure
- **WHEN** an editor changes "41" to "42" in the Spanish home content file and the site is rebuilt
- **THEN** the Spanish home shows "42" and no component code changes are needed

#### Scenario: Missing locale
- **WHEN** the Italian home content file is missing
- **THEN** the Italian home renders the English content

#### Scenario: Edit a carousel title
- **WHEN** an editor changes a slide title in the Spanish home content file and the site is rebuilt
- **THEN** the Spanish carousel shows the new title and no component code changes are needed

## ADDED Requirements

### Requirement: Recipe diagram
The recipe section SHALL show an editable lead and count, the component groups, and the sea-glass pile on the aqua palette color, plus a solutions link whose label is text beside its image.

#### Scenario: Fifteen components
- **WHEN** the Spanish home renders the recipe diagram
- **THEN** Introducción lists Resumen and Ubicación, Situación de partida lists four names, Cómo se hizo lists four names, Qué se logró lists five names, and the count reads "15"

#### Scenario: Desktop arrangement
- **WHEN** the home is opened at 1280px
- **THEN** the four groups sit around the stone pile on the aqua ground, with the solutions link beside them

#### Scenario: Enter solutions from the diagram
- **WHEN** the user activates the solutions link in the recipe section
- **THEN** the solutions explorer opens in the current locale

### Requirement: Inspiration carousel
The carousel SHALL show one full-bleed photograph at a time, with a title and a card that holds a kicker, a body, and a stone image. Dots SHALL move between slides at every width. Arrows SHALL appear at 1024px and above.

#### Scenario: Three slides
- **WHEN** the Spanish home renders the carousel
- **THEN** the slides are, in order, the amphibious-architecture title on the orange-and-blue waterside photograph with a blue card about Maasbommel, the walnut-and-wheat title on the yellow-and-green field photograph with a yellow card about SAFE, and the water-management title on the blue snow-canal photograph with an aqua card about Brenta

#### Scenario: Change slide
- **WHEN** the user activates a dot, or an arrow at 1024px or above
- **THEN** the carousel shows the corresponding slide

### Requirement: Stories call to action
The stories section SHALL show the stories photograph full-bleed, with an editable heading and a link to the stories index. The link label SHALL be text beside the stories stone image.

#### Scenario: Enter stories
- **WHEN** the user activates the stories link
- **THEN** the stories index opens in the current locale

### Requirement: Palette backgrounds
The recipe ground SHALL use the aqua palette color. The three carousel cards SHALL use the blue, yellow, and aqua palette colors. Stone and photograph files SHALL render as stored, including any background baked into the file.

#### Scenario: Opaque stone on a palette card
- **WHEN** a carousel stone image still contains its own background color
- **THEN** the card behind it stays the palette color and the image background remains visible

### Requirement: Button labels are text
Each home call to action SHALL show its label as text next to its image. The image SHALL NOT be the only place the label exists.

#### Scenario: Stories label is text
- **WHEN** the stories call to action renders
- **THEN** the label is a text node beside the stone image
