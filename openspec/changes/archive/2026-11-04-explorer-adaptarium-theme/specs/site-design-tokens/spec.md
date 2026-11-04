# Spec Delta

## MODIFIED Requirements

### Requirement: Existing tokens unchanged
Adding the ADAPTARIUM tokens SHALL NOT change the global values of existing tokens (Nuxt UI `primary`/`neutral` colors, existing color scales, `sans`/`mono`/`display` font families, radius, and editorial component variants). Pages in the ADAPTARIUM explorer theme MAY re-map the `neutral`, `gray`, and `slate` shades and the Nuxt UI primary, secondary, error, and warning colors within that theme. Pages outside the theme SHALL render those tokens with their global values.

#### Scenario: Global values preserved
- **WHEN** a user opens a connected or admin page after the change
- **THEN** its colors, fonts, buttons, and inputs look the same as before the change

#### Scenario: Explorer appearance preserved
- **WHEN** a user opens a page outside the ADAPTARIUM explorer theme that still uses the existing tokens, such as the about page
- **THEN** its colors, fonts, buttons, and inputs look the same as before the change

#### Scenario: Themed explorer page re-maps
- **WHEN** a user opens an explorer page that is in the ADAPTARIUM explorer theme
- **THEN** elements styled with the darkest neutral shade render ADAPTARIUM ink, and Nuxt UI primary buttons render ADAPTARIUM blue

## ADDED Requirements

### Requirement: ADAPTARIUM blue shade scale
The web app SHALL expose an eleven-step ADAPTARIUM blue scale (50 through 950) as namespaced color tokens, with step 600 equal to `#0f4fc4`, lighter steps toward white and darker steps toward navy, so that Nuxt UI can use the ADAPTARIUM blue as a primary color. Adding the scale SHALL NOT change the existing `adapt-blue` token, which stays `#0f4fc4`.

#### Scenario: Anchor step
- **WHEN** a component uses the background utility for step 600 of the ADAPTARIUM blue scale
- **THEN** the element renders `#0f4fc4`

#### Scenario: Scale ordering
- **WHEN** steps 50, 300, 600, and 900 of the scale are compared
- **THEN** each step is darker than the previous one

#### Scenario: Base token unchanged
- **WHEN** the scale is added
- **THEN** the existing ADAPTARIUM blue token still renders `#0f4fc4`
