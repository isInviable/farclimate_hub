/**
 * Maps Supabase `get_documents_by_ids` (and related RPC) rows to the explorer article document shape.
 */
import type { ArticleDetail } from '../../app/types/search'

export function normalizeRecipeIngredients(raw: unknown): Record<string, string> | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

export function mapKnowledgeRowToArticleDocument(row: Record<string, any>): ArticleDetail {
  return {
    id: String(row.id ?? ''),
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
    location: [row.location_lat || 0, row.location_lon || 0] as [number, number],
    implementation_years: {
      start_year: row.implementation_years_start ? parseInt(row.implementation_years_start, 10) : 0,
      end_year: row.implementation_years_end ? parseInt(row.implementation_years_end, 10) : 0,
    },
    contact: row.contact_preprocessed || '',
    references: row.references_preprocessed || '',
    websites: row.websites || {},
    recipe_ingredients: normalizeRecipeIngredients(row.recipe_ingredients),
  }
}

export function buildSearchHit(row: Record<string, any>, score: number) {
  return {
    id: row.id,
    document_uid: row.document_uid,
    score,
    document: mapKnowledgeRowToArticleDocument(row),
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isDocumentUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}
