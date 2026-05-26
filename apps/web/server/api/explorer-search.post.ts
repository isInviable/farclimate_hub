import { google } from "@ai-sdk/google"
import { embed } from "ai"
import { buildSearchHit } from "../utils/knowledgeDocument"
import { createPublicKnowledgeSupabaseClient } from "../utils/knowledgeSupabase"
import type {
  ExplorerSearchRequest,
  ExplorerSearchResponse,
} from "../../app/types/explorerSearch"
import type { FilterFacetsResponse } from "../../app/types/facets"

const EMBEDDING_MODEL = "gemini-embedding-001"
const EMBEDDING_DIMS = 768
const MAX_CACHE_SIZE = 100
const DEFAULT_PAGE_LIMIT = 60
const MAX_PAGE_LIMIT = 100
const DEFAULT_CANDIDATE_COUNT = 400
const MAX_CANDIDATE_COUNT = 1000

const embeddingCache = new Map<string, { embedding: number[], ts: number }>()

type FacetKey =
  | "sectors"
  | "climate_impacts"
  | "adaptation_approaches"
  | "keywords"
  | "biogeographical_regions"

type FacetFilters = Record<FacetKey, string[]>

type SummaryFacetRow = {
  document_id: string
  sectors: string[] | null
  climate_impacts: string[] | null
  adaptation_approaches: string[] | null
  keywords: string[] | null
  biogeographical_regions: string[] | null
}

type MatchedDocument = {
  id: string
  document_uid?: string
  title?: string
  score: number
  keyword_rank?: number | null
  semantic_rank?: number | null
}

const facetKeys: FacetKey[] = [
  "sectors",
  "climate_impacts",
  "adaptation_approaches",
  "keywords",
  "biogeographical_regions",
]

function getSupabaseClient() {
  return createPublicKnowledgeSupabaseClient()
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function parseFacetArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((v): v is string => typeof v === "string").map((s) => s.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
}

function normalizeRequest(body: ExplorerSearchRequest | undefined) {
  const query = (body?.query || "").trim()
  const lang = typeof body?.lang === "string" && body.lang.trim() ? body.lang.trim() : "en"
  const limit = clampInteger(body?.limit, DEFAULT_PAGE_LIMIT, 1, MAX_PAGE_LIMIT)
  const offset = clampInteger(body?.offset, 0, 0, Number.MAX_SAFE_INTEGER)
  const includeFacets = body?.includeFacets !== false
  const mode = body?.mode === "keyword" ? "keyword" : "hybrid"
  const candidateCount = clampInteger(
    body?.candidate_count,
    DEFAULT_CANDIDATE_COUNT,
    Math.max(limit + offset, limit),
    MAX_CANDIDATE_COUNT
  )
  const fullTextWeight = typeof body?.full_text_weight === "number" ? body.full_text_weight : 2
  const semanticWeight = typeof body?.semantic_weight === "number" ? body.semantic_weight : 1
  const rrfK = typeof body?.rrf_k === "number" ? body.rrf_k : 50
  const matchThreshold = typeof body?.match_threshold === "number" ? body.match_threshold : 0.0
  const minScore = typeof body?.min_score === "number" ? body.min_score : 0.02
  const filters = facetKeys.reduce((acc, key) => {
    acc[key] = parseFacetArray(body?.[key])
    return acc
  }, {} as FacetFilters)
  const signature = stableSignature({
    query,
    lang,
    mode,
    candidate_count: candidateCount,
    full_text_weight: fullTextWeight,
    semantic_weight: semanticWeight,
    rrf_k: rrfK,
    match_threshold: matchThreshold,
    min_score: minScore,
    filters,
  })

  return {
    query,
    lang,
    limit,
    offset,
    includeFacets,
    mode,
    candidateCount,
    fullTextWeight,
    semanticWeight,
    rrfK,
    matchThreshold,
    minScore,
    filters,
    hasFacetFilters: facetKeys.some((key) => filters[key].length > 0),
    signature,
    debug: Boolean(body?.debug),
  }
}

function stableSignature(value: unknown): string {
  return JSON.stringify(value)
}

function cacheKey(query: string, lang: string) {
  return `${lang}:${query.trim().toLowerCase()}`
}

function getCachedEmbedding(query: string, lang: string): number[] | null {
  const key = cacheKey(query, lang)
  const entry = embeddingCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > 10 * 60 * 1000) {
    embeddingCache.delete(key)
    return null
  }
  return entry.embedding
}

function setCachedEmbedding(query: string, lang: string, embedding: number[]) {
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    const oldest = embeddingCache.keys().next().value
    if (oldest) embeddingCache.delete(oldest)
  }
  embeddingCache.set(cacheKey(query, lang), { embedding, ts: Date.now() })
}

async function generateQueryEmbedding(query: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embedding(EMBEDDING_MODEL),
    value: query,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMS,
        taskType: "RETRIEVAL_QUERY",
      },
    },
  })
  if (!embedding || embedding.length !== EMBEDDING_DIMS) {
    throw new Error(
      `[explorer-search] Embedding dimension mismatch: expected ${EMBEDDING_DIMS}, got ${embedding?.length ?? 0}.`
    )
  }
  return embedding
}

function filterIdsByFacets(
  docIds: string[],
  summaryRows: SummaryFacetRow[],
  filters: FacetFilters
): string[] {
  if (!facetKeys.some((key) => filters[key].length > 0)) return docIds
  const byId = new Map(summaryRows.map((row) => [row.document_id, row]))

  return docIds.filter((id) => {
    const row = byId.get(id)
    if (!row) return false
    for (const key of facetKeys) {
      const selected = filters[key]
      if (selected.length === 0) continue
      const values = row[key] ?? []
      if (!selected.some((value) => values.includes(value))) return false
    }
    return true
  })
}

async function fetchSummaryRows(supabase: ReturnType<typeof getSupabaseClient>, docIds: string[]) {
  if (docIds.length === 0) return []
  const { data, error } = await supabase.rpc("get_summary_facet_arrays", { doc_ids: docIds })
  if (error) throw error
  return (data || []) as SummaryFacetRow[]
}

async function fetchBrowseMatches(
  supabase: ReturnType<typeof getSupabaseClient>,
  lang: string
): Promise<MatchedDocument[]> {
  const { data, error } = await supabase.rpc("get_all_documents", {
    filter_lang: lang,
  })
  if (error) throw error
  return (data || []).map((row: any) => ({
    id: row.id,
    document_uid: row.document_uid,
    title: row.title,
    score: 1,
  }))
}

async function fetchRankedMatches(
  supabase: ReturnType<typeof getSupabaseClient>,
  params: ReturnType<typeof normalizeRequest>
): Promise<{ matches: MatchedDocument[]; mode: "hybrid" | "keyword" }> {
  let embedding: number[] | null = null
  let useHybrid = params.mode === "hybrid"

  if (useHybrid) {
    embedding = getCachedEmbedding(params.query, params.lang)
    if (!embedding) {
      try {
        embedding = await generateQueryEmbedding(params.query)
        setCachedEmbedding(params.query, params.lang, embedding)
      } catch (err) {
        console.warn("[explorer-search] Embedding generation failed, falling back to keyword search:", err)
        useHybrid = false
      }
    }
  }

  if (useHybrid && embedding) {
    const vectorLiteral = `[${embedding.join(",")}]`
    const { data, error } = await supabase.rpc("hybrid_search", {
      query_text: params.query,
      query_embedding: vectorLiteral,
      match_count: params.candidateCount,
      filter_lang: params.lang,
      filter_content_type: "composed",
      full_text_weight: params.fullTextWeight,
      semantic_weight: params.semanticWeight,
      rrf_k: params.rrfK,
      match_threshold: params.matchThreshold,
    })

    if (!error) {
      return {
        mode: "hybrid",
        matches: (data || []).map((row: any) => ({
          id: row.id,
          document_uid: row.document_uid,
          title: row.title,
          score: row.score,
          keyword_rank: row.keyword_rank ?? null,
          semantic_rank: row.semantic_rank ?? null,
        })),
      }
    }

    console.warn("[explorer-search] hybrid_search RPC failed, falling back to keyword:", error)
  }

  const { data, error } = await supabase.rpc("keyword_search", {
    query_text: params.query,
    match_count: params.candidateCount,
    filter_lang: params.lang,
  })
  if (error) throw error
  return {
    mode: "keyword",
    matches: (data || []).map((row: any) => ({
      id: row.id,
      document_uid: row.document_uid,
      title: row.title,
      score: row.rank,
      keyword_rank: row.rank ?? null,
      semantic_rank: null,
    })),
  }
}

async function hydratePageHits(
  supabase: ReturnType<typeof getSupabaseClient>,
  pageMatches: MatchedDocument[],
  lang: string
) {
  if (pageMatches.length === 0) return []
  const pageIds = pageMatches.map((match) => match.id)
  const { data, error } = await supabase.rpc("get_documents_by_ids", {
    doc_ids: pageIds,
    filter_lang: lang,
  })
  if (error) throw error

  const docsMap = new Map((data || []).map((doc: any) => [doc.id, doc]))
  return pageMatches.map((match) => {
    const doc = docsMap.get(match.id)
    if (doc) return buildSearchHit(doc, match.score)
    return buildSearchHit(
      { id: match.id, document_uid: match.document_uid, title: match.title },
      match.score
    )
  })
}

async function fetchFacetsForMatches(
  supabase: ReturnType<typeof getSupabaseClient>,
  matchedIds: string[]
): Promise<FilterFacetsResponse | undefined> {
  const { data, error } = await supabase.rpc("get_filter_facets", {
    doc_ids: matchedIds.length > 0 ? matchedIds : null,
  })
  if (error) throw error
  return data as FilterFacetsResponse
}

export default defineEventHandler(async (event): Promise<ExplorerSearchResponse> => {
  const body = (await readBody(event).catch(() => ({}))) as ExplorerSearchRequest | undefined
  const params = normalizeRequest(body)
  const supabase = getSupabaseClient()

  try {
    const ranked = params.query
      ? await fetchRankedMatches(supabase, params)
      : { matches: await fetchBrowseMatches(supabase, params.lang), mode: "browse" as const }

    let matches = params.query
      ? ranked.matches.filter((match) => (match.score ?? 0) >= params.minScore)
      : ranked.matches

    if (params.hasFacetFilters && matches.length > 0) {
      const docIds = matches.map((match) => match.id)
      const summaryRows = await fetchSummaryRows(supabase, docIds)
      const allowedIds = new Set(filterIdsByFacets(docIds, summaryRows, params.filters))
      matches = matches.filter((match) => allowedIds.has(match.id))
    }

    const matchedIds = matches.map((match) => match.id)
    const pageMatches = matches.slice(params.offset, params.offset + params.limit)
    const hits = await hydratePageHits(supabase, pageMatches, params.lang)
    const facets = params.includeFacets
      ? await fetchFacetsForMatches(supabase, matchedIds)
      : undefined

    const response: ExplorerSearchResponse = {
      count: hits.length,
      hits,
      limit: params.limit,
      offset: params.offset,
      returned: hits.length,
      signature: params.signature,
    }

    if (params.includeFacets) {
      response.total = matchedIds.length
      response.facets = facets
    }

    if (params.debug) {
      response.debug = {
        mode: ranked.mode,
        candidate_count: params.candidateCount,
        matched_count: matchedIds.length,
        include_facets: params.includeFacets,
      }
    }

    return response
  } catch (error) {
    console.error("[explorer-search] Error:", error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "Explorer search failed",
    })
  }
})
