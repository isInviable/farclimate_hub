import type { FilterFacetsResponse } from './facets'
import type { ArticleDetail, SearchFacetParams } from './search'

export interface ExplorerSearchHit {
  id: string
  document_uid: string
  score: number
  document: ArticleDetail
}

export interface ExplorerSearchRequest extends SearchFacetParams {
  query?: string
  lang?: string
  limit?: number
  offset?: number
  includeFacets?: boolean
  mode?: 'hybrid' | 'keyword'
  candidate_count?: number
  full_text_weight?: number
  semantic_weight?: number
  rrf_k?: number
  match_threshold?: number
  min_score?: number
  debug?: boolean
}

export interface ExplorerSearchResponse {
  count: number
  hits: ExplorerSearchHit[]
  limit: number
  offset: number
  returned: number
  signature: string
  total?: number
  facets?: FilterFacetsResponse
  debug?: Record<string, unknown>
}
