import type { FilterFacetsResponse } from "@/types/facets"

/**
 * Fetches filter facets (global + for result set) from POST /api/facets.
 * Pass current hit IDs to get for_result_set counts; pass empty or omit for global only.
 */
export async function fetchFacets(docIds: string[]): Promise<FilterFacetsResponse> {
  const body = docIds.length > 0 ? { doc_ids: docIds } : {}
  return await $fetch<FilterFacetsResponse>("/api/facets", {
    method: "POST",
    body,
  })
}
