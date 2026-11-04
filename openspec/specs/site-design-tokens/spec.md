# site-design-tokens Specification

## Purpose

Provides the ADAPTARIUM color palette and typefaces to the public site as namespaced design tokens, isolated from the tokens the rest of the application already uses.

## Requirements

### Requirement: ADAPTARIUM color tokens
The web app SHALL expose the ADAPTARIUM palette as namespaced color tokens usable from utility classes: orange `#fc4b08`, blue `#0f4fc4`, teal `#249489`, brown `#86592b`, yellow `#fdbe0f`, mist `#bcd2d5`, sand `#eeeadf`, ink `#2c2c2c`, aqua `#85cec4`, paper `#f8e8d9` (background of the sea-glass photographs), sea `#37a797`, and foam `#92c8b7`.

#### Scenario: Palette color applied
- **WHEN** a component uses the background utility for the ADAPTARIUM orange token
- **THEN** the element renders with background color `#fc4b08`

#### Scenario: Paper matches photo background
- **WHEN** a sea-glass photograph with a beige background is placed on the paper token background
- **THEN** no visible edge appears between the photograph and the surrounding section

#### Scenario: Sea and foam applied
- **WHEN** a component uses the background utility for the sea token and another uses the foam token
- **THEN** those elements render with backgrounds `#37a797` and `#92c8b7`

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
- **WHEN** a user opens any explorer page after the change
- **THEN** its colors, fonts, buttons, and inputs look the same as before the change

### Requirement: Connected landing color tokens
The web app SHALL expose four additional namespaced color tokens as utility classes for the connected landing: connected hero `#1d418f`, connected mint `#8dc7b8`, connected figure `#005ae6`, and connected paper `#f8e9d9`. Adding them SHALL NOT change the hex values of the existing ADAPTARIUM tokens.

#### Scenario: Hero and mint applied
- **WHEN** a component uses the background utility for the connected hero token and another uses the background utility for the connected mint token
- **THEN** those elements render as `#1d418f` and `#8dc7b8`

#### Scenario: Figure and paper applied
- **WHEN** a component uses the text utility for the connected figure token and another uses the background utility for the connected paper token
- **THEN** those elements render as `#005ae6` and `#f8e9d9`

#### Scenario: Nearby palette swatches stay
- **WHEN** the connected landing tokens are added
- **THEN** blue, aqua, foam, and paper remain `#0f4fc4`, `#85cec4`, `#92c8b7`, and `#f8e8d9`

### Requirement: Skills index color tokens
The web app SHALL expose six additional namespaced color tokens as utility classes for the skills index: pine `#04625d`, lagoon `#27958a`, skills sea `#37a697`, skills paper `#f8e9d9`, skills card `#f7e9d9`, and skills rule `#fdbe0d`. Adding them SHALL NOT change the hex values of the existing ADAPTARIUM tokens.

#### Scenario: Pine and lagoon applied
- **WHEN** a component uses the text utility for the pine token and another uses the background utility for the lagoon token
- **THEN** those elements render as `#04625d` and `#27958a`

#### Scenario: Near-miss skills colors applied
- **WHEN** components use the skills sea, skills paper, skills card, and skills rule tokens
- **THEN** those elements render as `#37a697`, `#f8e9d9`, `#f7e9d9`, and `#fdbe0d`

#### Scenario: Existing palette unchanged
- **WHEN** the skills index tokens are added
- **THEN** orange, teal, yellow, ink, aqua, paper, and sea remain `#fc4b08`, `#249489`, `#fdbe0f`, `#2c2c2c`, `#85cec4`, `#f8e8d9`, and `#37a797`
