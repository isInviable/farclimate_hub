# Spec Delta

## Purpose

Provides the ADAPTARIUM color palette and typefaces to the public site as namespaced design tokens, isolated from the tokens the rest of the application already uses.

## ADDED Requirements

### Requirement: ADAPTARIUM color tokens
The web app SHALL expose the ADAPTARIUM palette as namespaced color tokens usable from utility classes: orange `#fc4b08`, blue `#0f4fc4`, teal `#249489`, brown `#86592b`, yellow `#fdbe0f`, mist `#bcd2d5`, sand `#eeeadf`, ink `#2c2c2c`, aqua `#85cec4`, and paper `#f8e8d9` (background of the sea-glass photographs).

#### Scenario: Palette color applied
- **WHEN** a component uses the background utility for the ADAPTARIUM orange token
- **THEN** the element renders with background color `#fc4b08`

#### Scenario: Paper matches photo background
- **WHEN** a sea-glass photograph with a beige background is placed on the paper token background
- **THEN** no visible edge appears between the photograph and the surrounding section

### Requirement: ADAPTARIUM typography tokens
The web app SHALL load Julius Sans One, Archivo Black, Bebas Neue, and Actor, and expose them as namespaced font families for titles, heavy display text, keywords, and body text respectively.

#### Scenario: Keyword font applied
- **WHEN** a component uses the keyword font family utility
- **THEN** the text renders in Bebas Neue

#### Scenario: Accented characters in all locales
- **WHEN** Spanish or Italian text with accented characters (for example "CLIMÁTICO", "Città") is rendered in any ADAPTARIUM font
- **THEN** every character renders in that font without falling back to a different typeface

### Requirement: Existing tokens unchanged
Adding the ADAPTARIUM tokens SHALL NOT change the values of existing tokens (Nuxt UI `primary`/`neutral` colors, existing color scales, `sans`/`mono`/`display` font families, radius, and editorial component variants).

#### Scenario: Explorer appearance preserved
- **WHEN** a user opens any explorer or connected page after the change
- **THEN** its colors, fonts, buttons, and inputs look the same as before the change
