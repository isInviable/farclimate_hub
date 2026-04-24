/**
 * Maps Supabase `get_documents_by_ids` (and related RPC) rows to the explorer article document shape.
 */
import type { ArticleDetail, DocumentImage } from '../../app/types/search'

export function normalizeRecipeIngredients(raw: unknown): Record<string, string> | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

/**
 * Lift the `images jsonb` column from the `get_*` knowledge RPCs into an array
 * of typed entries. Always returns an array (never null) so consumers can do
 * `document.images?.[0]?.public_url` / `v-for="img in document.images"` safely.
 */
export function normalizeDocumentImages(raw: unknown): DocumentImage[] {
  if (!Array.isArray(raw)) return []
  const out: DocumentImage[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const item = entry as Record<string, unknown>
    const position = typeof item.position === 'number' ? item.position : Number(item.position)
    const public_url = typeof item.public_url === 'string' ? item.public_url : ''
    if (!public_url || !Number.isFinite(position)) continue
    out.push({
      position,
      public_url,
      source_url: typeof item.source_url === 'string' ? item.source_url : undefined,
      title: typeof item.title === 'string' ? item.title : null,
      description: typeof item.description === 'string' ? item.description : null,
      credits: typeof item.credits === 'string' ? item.credits : null,
      content_type: typeof item.content_type === 'string' ? item.content_type : null,
      width: typeof item.width === 'number' ? item.width : null,
      height: typeof item.height === 'number' ? item.height : null,
      bytes: typeof item.bytes === 'number' ? item.bytes : null,
    })
  }
  out.sort((a, b) => a.position - b.position)
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
    images: normalizeDocumentImages(row.images),
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
