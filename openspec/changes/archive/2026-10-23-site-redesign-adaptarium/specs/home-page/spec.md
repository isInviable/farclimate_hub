# Spec Delta

## Purpose

Defines what the public home page shows and where its texts come from, following the ADAPTARIUM design: a hero introducing the platform and a stats band summarizing its coverage.

## ADDED Requirements

### Requirement: Home sections
The home page SHALL consist of, in order, the hero section, the stats section, and the site footer. The previous home sections (inspiration and sectors, why this matters, how the platform works, recipe) SHALL no longer be shown.

#### Scenario: Page structure
- **WHEN** a user opens the home page
- **THEN** they see the hero, then the stats band, then the footer, and none of the previous sections

### Requirement: Hero content
The hero SHALL show the ADAPTARIUM wordmark with "TRANSFORMATION HUB", the sea-glass image, an introductory text where designated keywords are emphasized in the keyword font, and a call to action that opens the solutions explorer.

#### Scenario: Keywords emphasized
- **WHEN** the Spanish home renders the intro
- **THEN** "SOLUCIONES LOCALES", "CAMBIO CLIMÁTICO", "RECETAS", and "UNIÓN EUROPEA" appear in the keyword font while the connecting text uses the body font

#### Scenario: Enter solutions
- **WHEN** the user activates the "Entrar a soluciones" call to action
- **THEN** the solutions explorer opens in the current locale

### Requirement: Stats content
The stats section SHALL show a solid blue block over the design team's processed photograph listing three figures with labels: more than 100 adaptation recipes, 41 European countries, and 7 bioregions.

#### Scenario: Stats rendered
- **WHEN** the user scrolls to the stats section
- **THEN** they see "100", "41", and "7" with their localized labels on the blue block

### Requirement: Localized editable content
All home texts, figures, and image references SHALL come from per-locale content files (en, es, it); a locale without a home file SHALL fall back to English.

#### Scenario: Edit a figure
- **WHEN** an editor changes "41" to "42" in the Spanish home content file and the site is rebuilt
- **THEN** the Spanish home shows "42" and no component code changes are needed

#### Scenario: Missing locale
- **WHEN** the Italian home content file is missing
- **THEN** the Italian home renders the English content

### Requirement: Responsive layout
Below 1024px the hero SHALL stack wordmark, sea-glass image, intro, and call to action in a single column, and the stats block SHALL span the content width.

#### Scenario: Phone layout
- **WHEN** the home is opened on a 390px-wide viewport
- **THEN** no horizontal scrolling occurs and every hero element is visible in one column

### Requirement: Home prerendered
The home page SHALL remain statically prerendered for every locale.

#### Scenario: Build output
- **WHEN** the site is built
- **THEN** `/`, `/es`, and `/it` are emitted as prerendered HTML containing the hero texts
