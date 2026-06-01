## MODIFIED Requirements

### Requirement: Filter components use real facet data

The Sector, Hazards (climate impacts), Adaptation approaches, and Biogeographical regions filter components SHALL be driven by real facet data. Options and corpus totals SHALL come from corpus metadata `globalFacets`. Current counts SHALL come from `for_result_set` facet data for the current full server-side matching set. The mapping SHALL be: Sector → `sectors`, Hazards → `climate_impacts`, Adaptation approaches → `adaptation_approaches`, Biogeographical regions → `biogeographical_regions`. Keywords SHALL NOT be exposed in the explorer filter interface.

Each filter option SHALL use the canonical English `value` from the API as its internal key and for search/filter requests. The visible option label SHALL be resolved through the shared facet-label i18n lookup for the corresponding category and active UI locale. Count lookups (current and corpus-wide) SHALL use the canonical English key, not the translated display label.

#### Scenario: Sector filter shows metadata-driven options

- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.sectors`
- **THEN** the Sector filter component SHALL display sector options and corpus total counts from that data

#### Scenario: Hazards filter shows metadata-driven options

- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.climate_impacts`
- **THEN** the Hazards (climate impacts) filter component SHALL display options and corpus total counts from that data

#### Scenario: Adaptation approaches filter shows metadata-driven options

- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.adaptation_approaches`
- **THEN** the Adaptation approaches filter component SHALL display options and corpus total counts from that data

#### Scenario: Biogeographical regions filter shows metadata-driven options

- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.biogeographical_regions`
- **THEN** the Biogeographical regions filter component SHALL display options and corpus totals from that data

#### Scenario: Current over total count per facet option

- **WHEN** the filter component renders a facet option
- **THEN** it SHALL show the current-result-set count in relation to the corpus-wide count for that value, for example `6 / 14`, using dual bars where the corpus total is the background or total bar and the current result-set count is the foreground or current bar

#### Scenario: Overlay counts update after result set changes

- **WHEN** the user applies a new search or facet filter and the result set changes
- **THEN** the current count and foreground bar SHALL update from `for_result_set` counts while the total count and background bar SHALL remain corpus-wide

#### Scenario: Translated label with English filter key

- **WHEN** the UI locale is Spanish and the user selects a climate impact whose canonical value is `Droughts`
- **THEN** the filter SHALL display the Spanish label from facet-label i18n, SHALL send `climate_impacts: ["Droughts"]` in the explorer search request, and SHALL show correct count bars keyed by `Droughts`

#### Scenario: Count bars unaffected by translation

- **WHEN** facet option labels are translated to a non-English locale
- **THEN** the dual-bar count display SHALL still reflect the correct numeric counts for each option (not zero or mismatched due to label/key confusion)

## ADDED Requirements

### Requirement: Filter option labels are locale-aware

The Sector, Hazards, Adaptation approaches, and Biogeographical regions filter components SHALL resolve visible option labels through the shared facet-label i18n lookup. Section titles (e.g. "Climate impacts") SHALL continue to use existing `filters.*` i18n keys.

#### Scenario: Spanish filter sidebar

- **WHEN** the explorer filter sidebar is rendered with UI locale Spanish and facet data includes `adaptation_approaches` value `Nature-based solutions`
- **THEN** the option label SHALL display the Spanish translation from `facets.adaptation_approaches["Nature-based solutions"]` while the internal selection key remains `Nature-based solutions`
