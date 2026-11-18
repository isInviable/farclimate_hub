# Spec Delta

## MODIFIED Requirements

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
