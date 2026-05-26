import { createError, defineEventHandler, readBody } from "h3"
import { assertOwnProject, authenticatedSupabaseFromEvent } from "../../utils/podcastSupabase"
import {
  createServiceSupabaseClient,
  getOrCreateShareLinkForProject,
  publicBoardPath,
  type PublicBoardShareResponse,
} from "../../utils/publicBoardSharing"

interface PublicBoardShareBody {
  projectId?: string
}

export default defineEventHandler(async (event): Promise<PublicBoardShareResponse> => {
  const { supabase, userId } = await authenticatedSupabaseFromEvent(event)
  const body = (await readBody(event).catch(() => ({}))) as PublicBoardShareBody
  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : ""

  if (!projectId) {
    throw createError({
      statusCode: 400,
      message: "projectId is required",
    })
  }

  await assertOwnProject(supabase, projectId, userId)

  const serviceSupabase = createServiceSupabaseClient()
  const share = await getOrCreateShareLinkForProject(serviceSupabase, projectId, userId)

  return {
    token: share.token,
    path: publicBoardPath(share.token),
  }
})
