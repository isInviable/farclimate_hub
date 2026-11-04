# connected-landing Specification

## Purpose

Defines the connected index as the sea-glass landing for the EU Climate Adaptation Mission network: a wordmark, a short introduction with live counts, and four links into the visualizations.

## Requirements

### Requirement: Connected index chrome
The connected index SHALL be served at `/connected`, `/es/connected`, and `/it/connected` with the same top bar, overlay navigation, and footer as the how-to page. The index SHALL NOT show the connected tab bar.

#### Scenario: Spanish index
- **WHEN** a user opens `/es/connected`
- **THEN** the page shows the public-site top bar and does not show the connected tab bar

#### Scenario: Reach from the menu
- **WHEN** the user selects "Trabajo en red" in the overlay
- **THEN** the Spanish connected index opens

### Requirement: Hero lockup
The index SHALL show the sea-glass photograph on the hero blue, with the English lockup CONNECTED, broken over three lines as CO, NNEC, and TED, and the word ACTION beneath it. The lockup SHALL stay English in every locale.

#### Scenario: Italian lockup
- **WHEN** the index is shown in Italian
- **THEN** the lockup still reads CONNECTED and ACTION in English over the sea-glass photograph

### Requirement: Introduction band
The index SHALL show a mint band containing a localized kicker, a localized title, a localized introduction, and the two-shard image under the introduction.

#### Scenario: Spanish heading
- **WHEN** the index is shown in Spanish
- **THEN** the kicker is "Explora el ecosistema de la" and the title is "Misión de Adaptación Climática de la UE"

#### Scenario: English introduction
- **WHEN** the index is shown in English
- **THEN** the introduction is the English text, not the Spanish paragraph

### Requirement: Live network counts
The mint band SHALL show four figures taken from the live network data, in this order: projects, entities, countries, and themes, each with its localized label. The figures SHALL follow the dataset rather than a fixed snapshot.

#### Scenario: Project count follows the data
- **WHEN** the live data contains a project count
- **THEN** the projects figure on the index shows that count

### Requirement: Four ways in
The index SHALL show the numeral 4, a localized ways label, and four links to the dashboard, the entities map, the project–entity network, and the projects UMAP. Each link SHALL show that view's existing title, lede, and description. The index SHALL NOT show a help control for this block.

#### Scenario: Open the map
- **WHEN** the user activates the entities map link
- **THEN** the entities map opens in the current locale

#### Scenario: Spanish ways label
- **WHEN** the index is shown in Spanish
- **THEN** the ways label reads "formas a explorar"

#### Scenario: No help control
- **WHEN** the index renders
- **THEN** the ways block has no help control

### Requirement: Narrow landing
Below 1024px the hero, the kicker and title, the introduction, the two-shard image, the four figures, the ways heading, and the four links SHALL stack in that order. Each link SHALL remain activatable.

#### Scenario: Phone stack
- **WHEN** the index is viewed at 390px wide
- **THEN** the four figures sit below the introduction and the four links stack in one column
