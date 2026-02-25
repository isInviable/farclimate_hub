export interface GeographicCharacterisation {
  biogeographical_regions: string
  city: string
  continent: string
  countries: string
  macro_transnational_region: string
  sub_nationals: string
}

export interface SearchResult {
  adaptation_approaches: string[]
  case_study_documents: any[]
  challenges: string
  climate_impacts: string[]
  contact: string
  cost_benefit: string
  creation_date: string
  geographic_characterisation: GeographicCharacterisation
  governance_level: string
  id: string
  image_url: string
  implementation_time: string
  keywords: string[]
  lifetime: string
  location: [number, number]
  objectives: string
  published_date: string
  references: string
  sectors: string
  solutions: string
  stakeholder_participation: string
  subtitle: string
  success_limitations: string
  title: string
  websites: {
    url: string
  }
  implementation_years: {
    start_year: number
    end_year: number
  }
  fulltext: string
}
