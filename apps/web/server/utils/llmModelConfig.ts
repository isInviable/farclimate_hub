export const DEFAULT_GENERATIVE_MODEL_NAME = "gemini-3.1-flash-lite-preview"

export const LLM_MODEL_CONFIG = {
  podcast_summary_model_name: {
    runtimeConfigKey: "podcastSummarizeModel",
    defaultModelName: DEFAULT_GENERATIVE_MODEL_NAME,
  },
  slideshow_model_name: {
    runtimeConfigKey: "slideshow_model_name",
    defaultModelName: DEFAULT_GENERATIVE_MODEL_NAME,
  },
} as const

export type LlmModelConfigName = keyof typeof LLM_MODEL_CONFIG

export function resolveLlmModelName(
  runtimeConfig: Record<string, unknown>,
  name: LlmModelConfigName
): string {
  const modelConfig = LLM_MODEL_CONFIG[name]
  const configured = runtimeConfig[modelConfig.runtimeConfigKey]
  return typeof configured === "string" && configured.trim()
    ? configured.trim()
    : modelConfig.defaultModelName
}
