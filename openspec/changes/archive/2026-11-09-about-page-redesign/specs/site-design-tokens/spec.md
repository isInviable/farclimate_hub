# Spec Delta

## MODIFIED Requirements

### Requirement: Existing tokens unchanged
Adding the ADAPTARIUM tokens SHALL NOT change the global values of existing tokens (Nuxt UI `primary`/`neutral` colors, existing color scales, `sans`/`mono`/`display` font families, radius, and editorial component variants). Pages in the ADAPTARIUM explorer theme MAY re-map the `neutral`, `gray`, and `slate` shades and the Nuxt UI primary, secondary, error, and warning colors within that theme. Pages outside the theme SHALL render those tokens with their global values.

#### Scenario: Global values preserved
- **WHEN** a user opens a connected or admin page after the change
- **THEN** its colors, fonts, buttons, and inputs look the same as before the change

#### Scenario: Explorer appearance preserved
- **WHEN** a user opens a page outside the ADAPTARIUM explorer theme that still uses the existing tokens, such as a page that remains on the default layout
- **THEN** its colors, fonts, buttons, and inputs look the same as before the change

#### Scenario: Themed explorer page re-maps
- **WHEN** a user opens an explorer page that is in the ADAPTARIUM explorer theme
- **THEN** elements styled with the darkest neutral shade render ADAPTARIUM ink, and Nuxt UI primary buttons render ADAPTARIUM blue
