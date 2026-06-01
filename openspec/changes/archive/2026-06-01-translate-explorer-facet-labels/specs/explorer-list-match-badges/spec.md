## MODIFIED Requirements

### Requirement: Nuxt UI and i18n

Badges SHALL use **Nuxt UI** (`UBadge` or documented equivalent). Badge labels for active filter dimensions (sector, climate impacts / hazards, adaptation approaches, biogeographical regions) SHALL be resolved through the shared facet-label i18n lookup using the canonical English filter key and the corresponding facet category. When no translation exists, the badge SHALL display the English canonical value.

#### Scenario: Spanish locale

- **WHEN** the UI locale is Spanish and a list row shows a badge for an active climate impact filter key `Flooding`
- **THEN** the badge label SHALL display the Spanish string from `facets.climate_impacts["Flooding"]`

#### Scenario: Missing translation on badge

- **WHEN** the UI locale is Italian and a badge key has no entry in `facets.<category>`
- **THEN** the badge SHALL display the English canonical key unchanged
