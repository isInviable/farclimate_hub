/**
 * Types for the filter facets API (POST /api/facets).
 * Shared between server (facets.post.ts) and frontend so the response is typed.
 */

/** One facet option: label and how many documents have it */
export interface FacetEntry {
  value: string
  count: number
}

/** Facet lists for the four filterable array fields (ordered by count descending) */
export interface FacetCategory {
  sectors: FacetEntry[]
  climate_impacts: FacetEntry[]
  adaptation_approaches: FacetEntry[]
  keywords: FacetEntry[]
}

/**
 * Response of POST /api/facets (and of Supabase RPC get_filter_facets).
 *
 * - global: counts over the entire knowledge.summary table (whole DB).
 * - for_result_set: when doc_ids were sent, counts restricted to those documents;
 *   otherwise empty arrays. Use to show "X of Y" / percentage in the UI.
 */
export interface FilterFacetsResponse {
  global: FacetCategory
  for_result_set: FacetCategory
}

/** Request body for POST /api/facets */
export interface FilterFacetsRequest {
  /** Optional list of document UUIDs (e.g. current search hit IDs). When provided, for_result_set is filled. */
  doc_ids?: string[]
}
