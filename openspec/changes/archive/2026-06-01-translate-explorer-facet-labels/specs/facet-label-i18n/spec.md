## ADDED Requirements

### Requirement: Facet label lookup by category and canonical English value

The web application SHALL provide a shared facet-label lookup that accepts a facet category (`climate_impacts`, `adaptation_approaches`, `sectors`, `biogeographical_regions`, `keywords`) and a canonical English value string, and returns the locale-appropriate display label for the active UI language.

#### Scenario: Translation exists for Spanish locale

- **WHEN** the UI locale is Spanish and the lookup is called with category `climate_impacts` and value `Droughts`
- **THEN** the function SHALL return the Spanish string defined under `facets.climate_impacts["Droughts"]` in the es locale file

#### Scenario: English locale returns identity mapping

- **WHEN** the UI locale is English and the lookup is called with any category and canonical value
- **THEN** the function SHALL return the trimmed English canonical value (identity mapping from `facets.*` or direct fallback)

#### Scenario: Missing translation falls back to English

- **WHEN** the lookup is called with a value that has no entry in the active locale's `facets.<category>` map
- **THEN** the function SHALL return the trimmed English input value unchanged

#### Scenario: Canonical key preserved for filtering

- **WHEN** a filter component or badge logic uses the lookup for display
- **THEN** the original English value SHALL remain the key used for selection state, API requests, and saved-search serialization; only the returned label is shown to the user

### Requirement: Facet translations stored under facets namespace

Locale files (`en.json`, `es.json`, `it.json`) SHALL define a `facets` object with one nested object per category. Each nested object SHALL use exact English database/API strings as JSON keys and locale-specific display strings as values.

#### Scenario: Controlled vocabulary categories present

- **WHEN** a locale file is loaded for the web app
- **THEN** it SHALL include `facets.climate_impacts`, `facets.adaptation_approaches`, `facets.sectors`, and `facets.biogeographical_regions` objects

#### Scenario: Keywords category present

- **WHEN** a locale file is loaded for the web app
- **THEN** it SHALL include a `facets.keywords` object covering keyword values present in the corpus inventory

#### Scenario: Bioregion sentinel value

- **WHEN** the corpus includes the facet value `no-identificados`
- **THEN** each non-English locale SHALL provide a translated display label for that value under `facets.biogeographical_regions`

### Requirement: Corpus inventory for facet translation keys

The project SHALL provide a script or documented procedure that enumerates unique canonical values per facet category from the knowledge corpus and outputs the key set used to populate `facets.*` locale entries.

#### Scenario: Inventory covers all categories

- **WHEN** the inventory script runs against the current database or corpus export
- **THEN** it SHALL emit distinct values for `climate_impacts`, `adaptation_approaches`, `sectors`, `biogeographical_regions`, and `keywords`

#### Scenario: New corpus values detectable

- **WHEN** a data push adds new facet values not present in locale files
- **THEN** the lookup fallback (English display) SHALL still work until locale files are updated from a fresh inventory run

### Requirement: Article summary and explorer views use facet label lookup

All user-facing render paths that display taxonomy tag values (chips, badges, filter option labels, bioregion chart labels) SHALL use the shared facet-label lookup rather than rendering raw English strings directly.

#### Scenario: Article summary keyword chips

- **WHEN** an article summary renders keyword chips and the UI locale is Italian
- **THEN** each chip SHALL display the translated keyword label when defined in `facets.keywords`, otherwise the English keyword

#### Scenario: Article summary sector and hazard chips

- **WHEN** an article summary renders sector, climate impact, or adaptation approach chips
- **THEN** each chip SHALL use the facet-label lookup for the corresponding category
