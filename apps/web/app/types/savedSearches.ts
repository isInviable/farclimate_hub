export interface SavedSearchFilters {
  searchQuery: string
  enabledFilters: Record<string, boolean>
  filters: Record<string, any>
}

export interface SavedSearch {
  id: string
  project_id: string
  name: string
  filters: SavedSearchFilters
  created_at: string
  updated_at: string
}
