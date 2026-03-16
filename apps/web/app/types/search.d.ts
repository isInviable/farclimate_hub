/** Optional facet filter params for POST /api/search. AND across categories, OR within each. */
export interface SearchFacetParams {
  sectors?: string[];
  climate_impacts?: string[];
  adaptation_approaches?: string[];
  keywords?: string[];
  biogeographical_regions?: string[];
}

export interface GeographicCharacterisation {
  biogeographical_regions?: string;
  city?: string;
  continent?: string;
  countries?: string;
  macro_transnational_region?: string;
  sub_nationals?: string;
}

export interface SearchResult {
  title: string;
  subtitle?: string;
  summary?: string;
  fulltext?: string;
  source_url?: string;
  document_uid?: string;
  image_url?: string;

  keywords?: string[];
  climate_impacts?: string[];
  adaptation_approaches?: string[];
  sectors?: string | string[];

  geographic_characterisation?: GeographicCharacterisation;
  location?: [number, number];

  implementation_years?: {
    start_year?: number;
    end_year?: number;
  };

  contact?: string;
  references?: string;
  websites?: { url?: string } | Record<string, any>;

  // Legacy fields — kept optional for backward compat
  id?: string;
  case_study_documents?: any[];
  challenges?: string;
  cost_benefit?: string;
  creation_date?: string;
  governance_level?: string;
  implementation_time?: string;
  lifetime?: string;
  objectives?: string;
  published_date?: string;
  solutions?: string;
  stakeholder_participation?: string;
  success_limitations?: string;
}

export interface ArticleDetail extends SearchResult {
  /**
   * Stable UUID of the document (knowledge.documents.id).
   * Required for side-panel views and downstream AI helpers.
   */
  id: string;
}
