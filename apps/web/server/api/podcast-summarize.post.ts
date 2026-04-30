import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { createError, defineEventHandler, readBody } from "h3"
import type { PodcastSummarizeResponse } from "~/types/podcastGeneration"
import {
  buildPodcastPrompt,
  fitTextToUtf8Bytes,
  normalizePodcastSummarizeRequest,
  validatePodcastContext,
} from "../utils/podcastContext"
import { authenticatedSupabaseFromEvent } from "../utils/podcastSupabase"

export default defineEventHandler(async (event): Promise<PodcastSummarizeResponse> => {
  await authenticatedSupabaseFromEvent(event)

  const body = await readBody(event)
  const request = normalizePodcastSummarizeRequest(body)
  const validation = validatePodcastContext(request)
  if (!validation.ok) {
    throw createError({
      statusCode: 400,
      message: validation.message ?? "Invalid podcast context",
    })
  }

  const config = useRuntimeConfig()
  const modelName =
    (config.podcastSummarizeModel as string | undefined) ||
    "gemini-3.1-flash-lite-preview"
  const prompt = buildPodcastPrompt(request)
  const result = await generateText({
    model: google(modelName),
    prompt,
  })

  return {
    script: fitTextToUtf8Bytes(result.text),
    sourceCount: request.sources.length,
    generatedAt: new Date().toISOString(),
    model: modelName,
  }
})
