import { randomUUID } from "node:crypto"
import { createError, defineEventHandler, readBody } from "h3"
import { insertPendingPinboardExportArtifact } from "../utils/pinboardExportArtifacts"
import { schedulePinboardExportJob } from "../utils/pinboardExportJob"
import { assertOwnProject, authenticatedSupabaseFromEvent, podcastArtifactObjectPath } from "../utils/podcastSupabase"

interface PinboardExportBody {
  projectId?: string
  lang?: string
}

export default defineEventHandler(async (event) => {
  const { supabase, userId } = await authenticatedSupabaseFromEvent(event)
  const config = useRuntimeConfig()
  const bucketId = (config.podcastArtifactBucket as string | undefined) || "human-artifacts"

  const body = (await readBody(event).catch(() => ({}))) as PinboardExportBody
  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : ""
  if (!projectId) {
    throw createError({
      statusCode: 400,
      message: "projectId is required",
    })
  }

  await assertOwnProject(supabase, projectId, userId)

  const artifactId = randomUUID()
  const objectPath = podcastArtifactObjectPath({
    ownerUserId: userId,
    projectId,
    artifactId,
    filename: "pinboard-export.zip",
  })

  const title = `Pinboard export · ${new Date().toISOString().slice(0, 19).replace("T", " ")}`
  const lang = typeof body.lang === "string" && body.lang.trim() ? body.lang.trim() : "en"

  const artifact = await insertPendingPinboardExportArtifact({
    supabase,
    artifactId,
    projectId,
    ownerUserId: userId,
    bucketId,
    objectPath,
    title,
  })

  schedulePinboardExportJob({
    supabase,
    userId,
    projectId,
    artifactId,
    bucketId,
    objectPath,
    documentLang: lang,
  })

  return { artifact }
})
