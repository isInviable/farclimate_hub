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
        // Reduce to match database vector(768) column
        outputDimensionality: EMBEDDING_DIMS,
        taskType: 'SEMANTIC_SIMILARITY',
      },
    },
  })
  return embedding
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
    },
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = (body?.query || '').trim()
  const lang = body?.lang || 'en'
  const limit = body?.limit || 30

  const supabase = getSupabaseClient()

  try {
    if (!query) {
      const { data, error } = await supabase.rpc('get_all_documents', {
        filter_lang: lang,
      })
      if (error) throw error

      const hits = (data || []).map((row: any) => buildHit(row, 1))
      return { count: hits.length, hits }
    }

    let embedding: number[] | null = getCachedEmbedding(query, lang)
    let useHybrid = true

    if (!embedding) {
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
      const vectorLiteral = `[${embedding.join(',')}]`
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_text: query,
        query_embedding: vectorLiteral,
        match_count: limit,
        filter_lang: lang,
        filter_content_type: 'composed',
        full_text_weight: 1,
        semantic_weight: 1,
        rrf_k: 50,
      })

      if (error) {
        console.warn('[search] hybrid_search RPC failed, falling back to keyword:', error)
        useHybrid = false
      } else {
        searchResults = data || []
      }
    }

    if (!useHybrid) {
      const { data, error } = await supabase.rpc('keyword_search', {
        query_text: query,
        match_count: limit,
        filter_lang: lang,
      })
      if (error) throw error
      searchResults = (data || []).map((r: any) => ({ ...r, score: r.rank }))
    }

    if (!searchResults || searchResults.length === 0) return { count: 0, hits: [] }

    const docIds = searchResults.map((r: any) => r.id)
    const { data: fullDocs, error: docsError } = await supabase.rpc('get_documents_by_ids', {
      doc_ids: docIds,
      filter_lang: lang,
    })
    if (docsError) throw docsError

    const docsMap = new Map((fullDocs || []).map((d: any) => [d.id, d]))

    const hits = searchResults.map((r: any) => {
      const doc = docsMap.get(r.id)
      if (doc) return buildHit(doc, r.score)
      return buildHit({ id: r.id, document_uid: r.document_uid, title: r.title }, r.score)
    })

    return { count: hits.length, hits }
  } catch (error) {
    console.error('[search] Error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Search failed',
    })
  }
})
