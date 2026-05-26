import { defineEventHandler, getRouterParam } from "h3"
import {
  createServiceSupabaseClient,
  loadPublicBoardByToken,
  type PublicBoardResponse,
} from "../../utils/publicBoardSharing"

export default defineEventHandler(async (event): Promise<PublicBoardResponse> => {
  const token = getRouterParam(event, "token")
  const supabase = createServiceSupabaseClient()
  return loadPublicBoardByToken(supabase, token)
})
