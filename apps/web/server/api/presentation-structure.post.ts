import { createError, defineEventHandler, readBody } from "h3"
import type { PresentationStructureResponse } from "~/types/presentationGeneration"
import {
  normalizePresentationStructureRequest,
  runPresentationStructureGeneration,
  validatePresentationRequest,
} from "../utils/presentationStructure"
import { resolveLlmModelName } from "../utils/llmModelConfig"
import { authenticatedSupabaseFromEvent } from "../utils/podcastSupabase"

export default defineEventHandler(async (event): Promise<PresentationStructureResponse> => {
  await authenticatedSupabaseFromEvent(event)

  const body = await readBody(event)
  const request = normalizePresentationStructureRequest(body)
  const validation = validatePresentationRequest(request)
  if (!validation.ok) {
    throw createError({
      statusCode: 400,
      message: validation.message ?? "Invalid presentation context",
    })
  }

  const config = useRuntimeConfig()
  const modelName = resolveLlmModelName(config, "slideshow_model_name")

  try {
    const presentation = await runPresentationStructureGeneration({
      request,
      modelName,
    })

    return {
      presentation,
      sourceCount: request.sources.length,
      generatedAt: new Date().toISOString(),
      model: modelName,
    }
  } catch (error) {
    throw createError({
      statusCode: 502,
      message:
        error instanceof Error
          ? error.message
          : "Presentation structure generation failed",
    })
  }
})
