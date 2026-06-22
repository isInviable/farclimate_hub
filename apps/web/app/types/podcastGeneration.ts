import type { ArtifactMetadataResponse } from "./artifacts"

export interface PodcastArticleMetadata {
  keywords?: string[]
  climateImpacts?: string[]
  adaptationApproaches?: string[]
  sectors?: string[]
}

export interface PodcastSelectedSource {
  id: string
  title?: string | null
  bodyKind?: string | null
  sourceDocumentUid?: string | null
  userNote?: string | null
  text?: string | null
  markdown?: string | null
  quote?: string | null
  fulltext?: string | null
  data?: Record<string, unknown> | null
  /** Parent article context, resolved client-side for any pin with a source document. */
  articleFullText?: string | null
  articleSummary?: string | null
  articleSubtitle?: string | null
  articleMetadata?: PodcastArticleMetadata | null
}

export interface PodcastSummarizeRequest {
  items: PodcastSelectedSource[]
  extraInstructions?: string
}

export interface PodcastSummarizeResponse {
  script: string
  sourceCount: number
  generatedAt: string
  model: string
}

export interface PodcastVoiceOptions {
  languageCode?: string
  name?: string
  ssmlGender?: "SSML_VOICE_GENDER_UNSPECIFIED" | "MALE" | "FEMALE" | "NEUTRAL"
}

export interface PodcastTextToSpeechRequest {
  projectId: string
  script: string
  title?: string
  sourcePinIds?: string[]
  metadata?: Record<string, unknown>
  voice?: PodcastVoiceOptions
  ssml?: boolean
}

export interface PodcastTextToSpeechResponse {
  artifact: ArtifactMetadataResponse
}
