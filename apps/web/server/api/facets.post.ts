/**
 * POST /api/facets — Filter facets (unique values + counts) for explorer filters.
 *
 * Calls the Supabase RPC `get_filter_facets`. Does not run raw SQL here; the SQL
 * lives in the DB migration (packages/db/sql/13_get_filter_facets.sql).
 *
 * @example Request (global only — no doc_ids)
 *   POST /api/facets
 *   Body: {} or { "doc_ids": null }
 *
 * @example Request (global + counts for current result set)
 *   POST /api/facets
 *   Body: { "doc_ids": ["uuid-1", "uuid-2", ...] }
 *
 * @example Response shape (see FilterFacetsResponse in ~/app/types/facets)
 *   {
 *     "global": {
 *       "sectors": [{ "value": "Agriculture", "count": 342 }, ...],
 *       "climate_impacts": [...],
 *       "adaptation_approaches": [...],
 *       "keywords": [...]
 *     },
 *     "for_result_set": {
 *       "sectors": [{ "value": "Agriculture", "count": 67 }, ...],
 *       ...
 *     }
 *   }
 *   Each list is ordered by count descending. When no doc_ids are sent, for_result_set has empty arrays.
 */

import { createClient } from "@supabase/supabase-js"
import type { FilterFacetsRequest, FilterFacetsResponse } from "../../app/types/facets"

function getSupabaseClient() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = (config.supabaseServiceRoleKey as string) || (config.public.supabasePublishableKey as string)
  return createClient(url, key)
}

const emptyFacets: FilterFacetsResponse = {
  global: { sectors: [], climate_impacts: [], adaptation_approaches: [], keywords: [], biogeographical_regions: [] },
  for_result_set: { sectors: [], climate_impacts: [], adaptation_approaches: [], keywords: [], biogeographical_regions: [] },
}

export default defineEventHandler(async (event): Promise<FilterFacetsResponse> => {
  const body = (await readBody(event).catch(() => ({}))) as FilterFacetsRequest | undefined
  const docIds = body?.doc_ids

  const supabase = getSupabaseClient()

  const rpcParams =
    Array.isArray(docIds) && docIds.length > 0
      ? { doc_ids: docIds }
      : { doc_ids: null }

  const { data, error } = await supabase.rpc("get_filter_facets", rpcParams)

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message ?? "Failed to fetch filter facets",
    })
  }

  return (data as FilterFacetsResponse) ?? emptyFacets
})
