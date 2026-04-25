import { createClient } from "@supabase/supabase-js"
import type {
  ExplorerCorpusMetadataResponse,
  FacetCategory,
  FilterFacetsResponse,
} from "../../../app/types/facets"

const CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const emptyFacets: FacetCategory = {
  sectors: [],
  climate_impacts: [],
  adaptation_approaches: [],
  keywords: [],
  biogeographical_regions: [],
}

function getSupabaseClient() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = (config.supabaseServiceRoleKey as string) || (config.public.supabasePublishableKey as string)
  return createClient(url, key)
}

async function getCorpusTotalCount(supabase: ReturnType<typeof getSupabaseClient>): Promise<number> {
  const { count, error } = await supabase
    .schema("knowledge")
    .from("documents")
    .select("id", { count: "exact", head: true })

  if (!error && typeof count === "number") return count

  // Some Supabase/PostgREST deployments expose only public RPCs. Fall back to the
  // existing public document RPC on cache miss, but never return those rows.
  const { data, error: rpcError } = await supabase.rpc("get_all_documents", {
    filter_lang: "en",
  })
  if (rpcError) throw rpcError

  return Array.isArray(data) ? data.length : 0
}

async function getCorpusMetadata(): Promise<ExplorerCorpusMetadataResponse> {
  const supabase = getSupabaseClient()
  const [{ data: facetsData, error: facetsError }, totalCount] = await Promise.all([
    supabase.rpc("get_filter_facets", { doc_ids: null }),
    getCorpusTotalCount(supabase),
  ])

  if (facetsError) {
    throw createError({
      statusCode: 500,
      message: facetsError.message ?? "Failed to fetch corpus facets",
    })
  }

  const facets = facetsData as FilterFacetsResponse | null

  return {
    totalCount,
    globalFacets: facets?.global ?? emptyFacets,
  }
}

export default defineCachedEventHandler(
  async (): Promise<ExplorerCorpusMetadataResponse> => {
    return await getCorpusMetadata()
  },
  {
    maxAge: CACHE_MAX_AGE_SECONDS,
    swr: false,
  }
)
