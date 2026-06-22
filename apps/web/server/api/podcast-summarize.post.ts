import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { resolveLlmModelName } from "../utils/llmModelConfig"
import { createError, defineEventHandler, readBody } from "h3"
import type { PodcastSummarizeResponse } from "~/types/podcastGeneration"
import { normalizePodcastScriptComments } from "~/utils/podcastScript"
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
  const modelName = resolveLlmModelName(config, "podcast_summary_model_name")
  const prompt = buildPodcastPrompt(request)
  const result = await generateText({
    model: google(modelName),
    prompt,
  })

  return {
    script: fitTextToUtf8Bytes(normalizePodcastScriptComments(result.text)),
    sourceCount: request.sources.length,
    generatedAt: new Date().toISOString(),
    model: modelName,
  }
})
