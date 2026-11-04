# Spec Delta

## ADDED Requirements

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
