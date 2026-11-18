# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Existing tokens unchanged
Adding the ADAPTARIUM tokens SHALL NOT change the values of existing tokens (Nuxt UI `primary`/`neutral` colors, existing color scales, `sans`/`mono`/`display` font families, radius, and editorial component variants).

#### Scenario: Explorer appearance preserved
- **WHEN** a user opens any explorer page after the change
- **THEN** its colors, fonts, buttons, and inputs look the same as before the change
