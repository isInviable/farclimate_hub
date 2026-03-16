/**
 * Project shape aligned with Supabase human.projects.
 * Used for list/create/update from the frontend.
 */
export interface Project {
  id: string
  owner_user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}
