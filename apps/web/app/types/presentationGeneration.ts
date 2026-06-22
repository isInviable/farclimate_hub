export interface PresentationArticleMetadata {
  keywords?: string[]
  climateImpacts?: string[]
  adaptationApproaches?: string[]
  sectors?: string[]
}

export interface PresentationSelectedSource {
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
  articleMetadata?: PresentationArticleMetadata | null
}

export interface PresentationGenerationInstructions {
  tone?: string
  language?: string
  audience?: string
  slideCount?: number
  extra?: string
}

export interface PresentationStructureRequest {
  items: PresentationSelectedSource[]
  instructions?: string | PresentationGenerationInstructions
  extraInstructions?: string
  requestedSlideCount?: number
}

export interface PresentationImageReference {
  sourceId: string
  alt?: string
  caption?: string
}

export interface PresentationCoverSlide {
  type: "cover"
  title: string
  subtitle?: string
  debugSourceIds?: string[]
}

export interface PresentationBulletsSlide {
  type: "bullets"
  title: string
  bullets: string[]
  debugSourceIds?: string[]
}

export interface PresentationImageTitleSlide {
  type: "image-title"
  title: string
  image: PresentationImageReference
  debugSourceIds?: string[]
}

export interface PresentationImageBulletsSlide {
  type: "image-bullets"
  title: string
  image: PresentationImageReference
  bullets: string[]
  debugSourceIds?: string[]
}

export type PresentationSlide =
  | PresentationCoverSlide
  | PresentationBulletsSlide
  | PresentationImageTitleSlide
  | PresentationImageBulletsSlide

export interface PresentationStructure {
  title: string
  subtitle?: string
  slides: PresentationSlide[]
}

export interface PresentationStructureResponse {
  presentation: PresentationStructure
  sourceCount: number
  generatedAt: string
  model: string
}
