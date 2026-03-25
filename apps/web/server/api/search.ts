import { google } from "@ai-sdk/google"
import { embed } from "ai"
import { createClient } from "@supabase/supabase-js"

const EMBEDDING_MODEL = "gemini-embedding-001"
const EMBEDDING_DIMS = 768
const MAX_CACHE_SIZE = 100

const embeddingCache = new Map<string, { embedding: number[], ts: number }>()

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

function getSupabaseClient() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = (config.supabaseServiceRoleKey as string) || (config.public.supabasePublishableKey as string)
  return createClient(url, key)
}

async function generateQueryEmbedding(query: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embedding(EMBEDDING_MODEL),
    value: query,
    providerOptions: {
      google: {
        // Must match knowledge.embeddings (vector(768)) and packages/db embed.ts (RETRIEVAL_DOCUMENT)
        outputDimensionality: EMBEDDING_DIMS,
        taskType: 'RETRIEVAL_QUERY',
      },
    },
  })
  if (!embedding || embedding.length !== EMBEDDING_DIMS) {
    throw new Error(
      `[search] Embedding dimension mismatch: expected ${EMBEDDING_DIMS}, got ${embedding?.length ?? 0}. ` +
      'Ensure Gemini API returns outputDimensionality 768 (AI SDK may ignore it in some versions).'
    )
  }
  return embedding
}

/** Normalize body array to string[]; empty if omitted or invalid */
function parseFacetArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string').map((s) => s.trim()).filter(Boolean)
}

type SummaryFacetRow = {
  document_id: string
  sectors: string[] | null
  climate_impacts: string[] | null
  adaptation_approaches: string[] | null
  keywords: string[] | null
  biogeographical_regions: string[] | null
}

/** AND across categories, OR within. Returns ids that have at least one match in each non-empty filter array. */
function filterIdsByFacets(
  docIds: string[],
  summaryRows: SummaryFacetRow[],
  filters: { sectors: string[]; climate_impacts: string[]; adaptation_approaches: string[]; keywords: string[]; biogeographical_regions: string[] }
): string[] {
  const hasSectors = filters.sectors.length > 0
  const hasClimate = filters.climate_impacts.length > 0
  const hasAdaptation = filters.adaptation_approaches.length > 0
  const hasKeywords = filters.keywords.length > 0
  const hasRegions = filters.biogeographical_regions.length > 0
  if (!hasSectors && !hasClimate && !hasAdaptation && !hasKeywords && !hasRegions) return docIds

  const byId = new Map(summaryRows.map((r) => [r.document_id, r]))
  return docIds.filter((id) => {
    const row = byId.get(id)
    if (!row) return false
    const s = row.sectors ?? []
    const c = row.climate_impacts ?? []
    const a = row.adaptation_approaches ?? []
    const k = row.keywords ?? []
    const r = row.biogeographical_regions ?? []
    if (hasSectors && !filters.sectors.some((v) => s.includes(v))) return false
    if (hasClimate && !filters.climate_impacts.some((v) => c.includes(v))) return false
    if (hasAdaptation && !filters.adaptation_approaches.some((v) => a.includes(v))) return false
    if (hasKeywords && !filters.keywords.some((v) => k.includes(v))) return false
    if (hasRegions && !filters.biogeographical_regions.some((v) => r.includes(v))) return false
    return true
  })
}

function normalizeRecipeIngredients(raw: unknown): Record<string, string> | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

function buildHit(row: Record<string, any>, score: number) {
  return {
    id: row.id,
    document_uid: row.document_uid,
    score,
    document: {
      id: row.id,
      title: row.title || '',
      subtitle: row.subtitle || '',
      summary: row.summary || '',
      fulltext: row.fulltext || '',
      source_url: row.source_url || '',
      document_uid: row.document_uid,
      image_url: row.image_url || '',
      keywords: row.keywords || [],
      climate_impacts: row.climate_impacts || [],
      adaptation_approaches: row.adaptation_approaches || [],
      sectors: row.sectors || [],
      geographic_characterisation: row.geographic_characterisation || {},
      location: [row.location_lat || 0, row.location_lon || 0],
      implementation_years: {
        start_year: row.implementation_years_start ? parseInt(row.implementation_years_start) : 0,
        end_year: row.implementation_years_end ? parseInt(row.implementation_years_end) : 0,
      },
      contact: row.contact_preprocessed || '',
      references: row.references_preprocessed || '',
      websites: row.websites || {},
      recipe_ingredients: normalizeRecipeIngredients(row.recipe_ingredients),
    },
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = (body?.query || '').trim()
  const lang = body?.lang || 'en'
  const limit = body?.limit || 30
  const debug = Boolean(body?.debug)
  const requestedMode = body?.mode === 'keyword' ? 'keyword' : 'hybrid'
  // Tuning: higher full_text_weight favors exact keyword matches (see https://www.adarsha.dev/blog/rag-supabase-hybrid-search-ai-sdk)
  const fullTextWeight = typeof body?.full_text_weight === 'number' ? body.full_text_weight : 2
  const semanticWeight = typeof body?.semantic_weight === 'number' ? body.semantic_weight : 1
  const rrfK = typeof body?.rrf_k === 'number' ? body.rrf_k : 50
  // Cosine similarity threshold for the semantic CTE (0.0–1.0). Filters at the DB level
  // following Supabase match_documents pattern (see https://supabase.com/docs/guides/ai/semantic-search).
  // 0.0 = no filtering. Values like 0.3 filter out semantically unrelated documents.
  const matchThreshold = typeof body?.match_threshold === 'number' ? body.match_threshold : 0.0
  // Server-side RRF score floor. Kept as a secondary safety net.
  const minScore = typeof body?.min_score === 'number' ? body.min_score : 0.02
  // Facet filters: AND across categories, OR within (see filterIdsByFacets).
  const sectors = parseFacetArray(body?.sectors)
  const climate_impacts = parseFacetArray(body?.climate_impacts)
  const adaptation_approaches = parseFacetArray(body?.adaptation_approaches)
  const keywords = parseFacetArray(body?.keywords)
  const biogeographical_regions = parseFacetArray(body?.biogeographical_regions)
  const hasFacetFilters = sectors.length > 0 || climate_impacts.length > 0 || adaptation_approaches.length > 0 || keywords.length > 0 || biogeographical_regions.length > 0
  const facetFilters = { sectors, climate_impacts, adaptation_approaches, keywords, biogeographical_regions }

  const supabase = getSupabaseClient()

  try {
    if (!query) {
      const { data, error } = await supabase.rpc('get_all_documents', {
        filter_lang: lang,
      })
      if (error) throw error

      let rows = (data || []) as any[]
      if (hasFacetFilters && rows.length > 0) {
        const docIds = rows.map((r: any) => r.id)
        const { data: summaryData, error: summaryErr } = await supabase.rpc('get_summary_facet_arrays', { doc_ids: docIds })
        if (summaryErr) throw summaryErr
        const summaryRows = (summaryData || []) as SummaryFacetRow[]
        const allowedIds = new Set(filterIdsByFacets(docIds, summaryRows, facetFilters))
        rows = rows.filter((r: any) => allowedIds.has(r.id)).slice(0, limit)
      }
      const hits = rows.map((row: any) => buildHit(row, 1))
      return { count: hits.length, hits }
    }

    let embedding: number[] | null = getCachedEmbedding(query, lang)
    let useHybrid = requestedMode === 'hybrid'

    if (useHybrid && !embedding) {
      try {
        embedding = await generateQueryEmbedding(query)
        setCachedEmbedding(query, lang, embedding)
      } catch (err) {
        console.warn('[search] Embedding generation failed, falling back to keyword search:', err)
        useHybrid = false
      }
    }

    let searchResults: any[] | undefined

    if (useHybrid && embedding) {
      if (embedding.length !== EMBEDDING_DIMS) {
        console.warn(`[search] Cached embedding has wrong length ${embedding.length}, expected ${EMBEDDING_DIMS}; skipping hybrid`)
        useHybrid = false
      }
    }
    if (useHybrid && embedding) {
      const vectorLiteral = `[${embedding.join(',')}]`
      const matchCount = hasFacetFilters ? Math.min(Math.max(limit * 3, limit), 90) : limit
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_text: query,
        query_embedding: vectorLiteral,
        match_count: matchCount,
        filter_lang: lang,
        filter_content_type: 'composed',
        full_text_weight: fullTextWeight,
        semantic_weight: semanticWeight,
        rrf_k: rrfK,
        match_threshold: matchThreshold,
      })

      if (error) {
        console.warn('[search] hybrid_search RPC failed, falling back to keyword:', error)
        useHybrid = false
      } else {
        searchResults = data || []
        if (debug) {
          console.info('[search] hybrid_search results (top 3)', {
            query,
            lang,
            mode: 'hybrid',
            sample: (searchResults || []).slice(0, 3).map((r: any) => ({
              id: r.id,
              title: r.title,
              score: r.score,
              keyword_rank: r.keyword_rank ?? null,
              semantic_rank: r.semantic_rank ?? null,
            })),
          })
        }
      }
    }

    if (!useHybrid) {
      const matchCount = hasFacetFilters ? Math.min(Math.max(limit * 3, limit), 90) : limit
      const { data, error } = await supabase.rpc('keyword_search', {
        query_text: query,
        match_count: matchCount,
        filter_lang: lang,
      })
      if (error) throw error
      searchResults = (data || []).map((r: any) => ({ ...r, score: r.rank }))
      if (debug) {
        console.info('[search] keyword_search results (top 3)', {
          query,
          lang,
          mode: 'keyword',
          sample: (searchResults || []).slice(0, 3).map((r: any) => ({
            id: r.id,
            title: r.title,
            score: r.score,
            keyword_rank: (r as any).rank ?? null,
            semantic_rank: null,
          })),
        })
      }
    }

    if (!searchResults || searchResults.length === 0) return { count: 0, hits: [] }

    let filteredResults = searchResults.filter((r: any) => (r.score ?? 0) >= minScore)
    if (filteredResults.length === 0) return { count: 0, hits: [] }

    if (hasFacetFilters) {
      const docIds = filteredResults.map((r: any) => r.id)
      const { data: summaryData, error: summaryErr } = await supabase.rpc('get_summary_facet_arrays', { doc_ids: docIds })
      if (summaryErr) throw summaryErr
      const summaryRows = (summaryData || []) as SummaryFacetRow[]
      const allowedIds = new Set(filterIdsByFacets(docIds, summaryRows, facetFilters))
      filteredResults = filteredResults.filter((r: any) => allowedIds.has(r.id)).slice(0, limit)
      if (filteredResults.length === 0) return { count: 0, hits: [] }
    }

    const docIds = filteredResults.map((r: any) => r.id)
    const { data: fullDocs, error: docsError } = await supabase.rpc('get_documents_by_ids', {
      doc_ids: docIds,
      filter_lang: lang,
    })
    if (docsError) throw docsError

    const docsMap = new Map((fullDocs || []).map((d: any) => [d.id, d]))

    const hits = filteredResults.map((r: any) => {
      const doc = docsMap.get(r.id)
      if (doc) return buildHit(doc, r.score)
      return buildHit({ id: r.id, document_uid: r.document_uid, title: r.title }, r.score)
    })

    if (debug) {
      return {
        count: hits.length,
        hits,
        debug: {
          mode: useHybrid ? 'hybrid' : 'keyword',
          min_score: minScore,
          match_threshold: matchThreshold,
          filtered_count: filteredResults.length,
          total_before_filter: searchResults.length,
          ...(useHybrid && {
            full_text_weight: fullTextWeight,
            semantic_weight: semanticWeight,
            rrf_k: rrfK,
          }),
          raw: filteredResults.map((r: any) => ({
            id: r.id,
            title: r.title,
            score: r.score,
            keyword_rank: (r as any).keyword_rank ?? (r as any).rank ?? null,
            semantic_rank: (r as any).semantic_rank ?? null,
          })),
        },
      }
    }

    return { count: hits.length, hits }
  } catch (error) {
    console.error('[search] Error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Search failed',
    })
  }
})
