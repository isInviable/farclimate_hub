# Explorer corpus metadata Specification

## Purpose

Define the explorer-wide corpus metadata endpoint, its cached aggregate behavior, and how the explorer uses corpus totals separately from bounded search result loading.

## Requirements

### Requirement: Cached explorer corpus metadata endpoint

The system SHALL provide a Nuxt server route at `GET /api/explorer/corpus-metadata` that returns explorer-wide corpus metadata without returning article documents. The response SHALL include `totalCount` for the number of unique case studies and `globalFacets` containing corpus-wide facet counts for `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords`, and `biogeographical_regions`.

#### Scenario: Metadata response shape

- **WHEN** the client requests `GET /api/explorer/corpus-metadata`
- **THEN** the endpoint SHALL return JSON with `totalCount` as a number and `globalFacets` as an object containing each supported facet category as an array of `{ value, count }` entries ordered by count descending

#### Scenario: Metadata endpoint does not return documents

- **WHEN** the client requests corpus metadata
- **THEN** the response SHALL NOT include article hit arrays, full document objects, summaries, fulltext, or image payloads

### Requirement: Corpus total counts unique case studies

The corpus metadata endpoint SHALL count unique case studies/documents once, regardless of localized English or Spanish content rows. Spanish and English translations SHALL share the same corpus total.

#### Scenario: Locale-invariant corpus total

- **WHEN** the explorer is viewed in English or Spanish
- **THEN** the total case study count shown by the explorer SHALL be the same because it represents unique case studies, not localized content rows

### Requirement: Long-lived Nitro cache for corpus metadata

The corpus metadata endpoint SHALL use Nitro server-side caching with a long cache lifetime suitable for a corpus that changes only when production papers are refreshed. Cache invalidation for the MVP SHALL be deploy-based: after a paper refresh, redeploying or restarting the server runtime SHALL cause metadata to be recomputed on the next request.

#### Scenario: Repeated metadata requests use cache

- **WHEN** multiple clients request `GET /api/explorer/corpus-metadata` within the cache lifetime
- **THEN** the server SHALL reuse the cached metadata response rather than recomputing the corpus aggregate for every request

#### Scenario: Deploy-based invalidation

- **WHEN** the production paper list is refreshed and the application is redeployed or restarted
- **THEN** the first metadata request after redeploy SHALL compute metadata from the refreshed corpus and subsequent requests SHALL use the new cached response

### Requirement: Explorer displays loaded results against corpus total

The explorer SHALL display result count copy using the number of currently loaded/displayed result cards and the corpus `totalCount`, with wording equivalent to `Showing 30 of 842 case studies`.

#### Scenario: Initial bounded results shown against total

- **WHEN** the explorer loads 30 initial result cards and corpus metadata reports `totalCount` of 842
- **THEN** the explorer SHALL display wording equivalent to `Showing 30 of 842 case studies`

#### Scenario: Search result count shown against corpus total

- **WHEN** the user performs a search and the client displays 12 returned result cards while corpus metadata reports `totalCount` of 842
- **THEN** the explorer SHALL display wording equivalent to `Showing 12 of 842 case studies` and SHALL NOT claim that 842 is the number of matching search results
