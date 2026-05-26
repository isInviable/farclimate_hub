import { google } from "@ai-sdk/google"

export const DEFAULT_GENERATIVE_MODEL_NAME = "gemini-3.1-flash-lite"

export const LLM_MODEL_CONFIG = {
  podcast_summary_model_name: {
    runtimeConfigKey: "podcastSummarizeModel",
  },
  slideshow_model_name: {
    runtimeConfigKey: "slideshow_model_name",
  },
} as const

export type LlmModelConfigName = keyof typeof LLM_MODEL_CONFIG

export function resolveDefaultGenerativeModel(
  runtimeConfig: Record<string, unknown>
): string {
  const configured = runtimeConfig.generativeModel
  return typeof configured === "string" && configured.trim()
    ? configured.trim()
    : DEFAULT_GENERATIVE_MODEL_NAME
}

export function googleGenerativeModel(runtimeConfig: Record<string, unknown>) {
  return google(resolveDefaultGenerativeModel(runtimeConfig))
}

export function resolveLlmModelName(
  runtimeConfig: Record<string, unknown>,
  name: LlmModelConfigName
): string {
  const modelConfig = LLM_MODEL_CONFIG[name]
  const configured = runtimeConfig[modelConfig.runtimeConfigKey]
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim()
  }
  return resolveDefaultGenerativeModel(runtimeConfig)
}
