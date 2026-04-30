import { createError, defineEventHandler, readBody } from "h3"
import type { PodcastTextToSpeechResponse } from "~/types/podcastGeneration"
import {
  createPodcastAudioArtifact,
  normalizePodcastTtsRequest,
  validatePodcastTtsRequest,
} from "../utils/podcastTextToSpeech"
import { authenticatedSupabaseFromEvent } from "../utils/podcastSupabase"

export default defineEventHandler(async (event): Promise<PodcastTextToSpeechResponse> => {
  const { supabase, userId } = await authenticatedSupabaseFromEvent(event)
  const config = useRuntimeConfig()
  const request = normalizePodcastTtsRequest(await readBody(event), {
    languageCode: config.podcastTtsLanguageCode as string | undefined,
    voiceName: config.podcastTtsVoiceName as string | undefined,
    ssmlGender: config.podcastTtsSsmlGender as string | undefined,
  })

  const validation = validatePodcastTtsRequest(request)
  if (!validation.ok) {
    throw createError({
      statusCode: 400,
      message: validation.message ?? "Invalid podcast text-to-speech request",
    })
  }

  const bucketId = (config.podcastArtifactBucket as string | undefined) || "human-artifacts"
  const artifact = await createPodcastAudioArtifact({
    supabase,
    userId,
    request,
    bucketId,
    googleTtsApiKey: config.googleTtsApiKey as string | undefined,
  })

  return { artifact }
})
