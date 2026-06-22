import type {
  PodcastArticleMetadata,
  PodcastSelectedSource,
  PodcastSummarizeRequest,
} from "~/types/podcastGeneration"
import {
  ARTIFACT_MAX_SELECTED_ITEMS,
  assembleArtifactContext,
  type ArtifactSourceInput,
} from "~/utils/artifactSourceContext"

export const PODCAST_MAX_SELECTED_ITEMS = ARTIFACT_MAX_SELECTED_ITEMS
/** Google Text-to-Speech `input.text` / `input.ssml` limit is 4,000 bytes. */
export const PODCAST_MAX_TTS_INPUT_BYTES = 4_000
/** Keep generated summaries below the hard TTS limit, leaving room for punctuation edits. */
export const PODCAST_SUMMARY_TARGET_BYTES = 3_800

export interface NormalizedPodcastSource {
  id: string
  title: string
  bodyKind: string
  sourceDocumentUid: string | null
  userNote: string
  text: string
  articleFullText: string
  articleSummary: string
  articleSubtitle: string
  articleMetadata: PodcastArticleMetadata
}

export interface NormalizedPodcastSummarizeRequest {
  sources: NormalizedPodcastSource[]
  extraInstructions: string
}

export interface PodcastValidationResult {
  ok: boolean
  message?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function sourceText(source: PodcastSelectedSource): string {
  const data = asRecord(source.data)
  const candidates = [
    source.text,
    source.markdown,
    source.quote,
    source.fulltext,
    data.markdown,
    data.quote,
    data.fulltext,
    data.description,
    data.summary,
    data.text,
  ]
  return candidates.map(stringFrom).find(Boolean) ?? ""
}

function sourceTextFromRow(
  row: Record<string, unknown>,
  data: Record<string, unknown>
): string {
  return sourceText({
    id: stringFrom(row.id),
    text: stringFrom(row.text),
    markdown: stringFrom(row.markdown),
    quote: stringFrom(row.quote),
    fulltext: stringFrom(row.fulltext),
    data,
  })
}

function stringArrayFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(stringFrom).filter(Boolean)
}

function articleMetadataFromRow(
  row: Record<string, unknown>,
  data: Record<string, unknown>
): PodcastArticleMetadata {
  const meta = asRecord(row.articleMetadata ?? data.articleMetadata)
  return {
    keywords: stringArrayFrom(meta.keywords ?? row.keywords ?? data.keywords),
    climateImpacts: stringArrayFrom(
      meta.climateImpacts ?? row.climate_impacts ?? data.climate_impacts
    ),
    adaptationApproaches: stringArrayFrom(
      meta.adaptationApproaches ?? row.adaptation_approaches ?? data.adaptation_approaches
    ),
    sectors: stringArrayFrom(meta.sectors ?? row.sectors ?? data.sectors),
  }
}

function podcastSourcesToArtifactInputs(
  sources: NormalizedPodcastSource[]
): ArtifactSourceInput[] {
  return sources.map((source) => ({
    id: source.id,
    title: source.title,
    bodyKind: source.bodyKind,
    sourceDocumentUid: source.sourceDocumentUid,
    userNote: source.userNote,
    text: source.text,
    articleFullText: source.articleFullText,
    articleSummary: source.articleSummary,
    articleSubtitle: source.articleSubtitle,
    articleMetadata: source.articleMetadata,
    isImage: source.bodyKind === "image",
  }))
}

export function normalizePodcastSummarizeRequest(
  body: unknown
): NormalizedPodcastSummarizeRequest {
  const input = asRecord(body)
  const rawItems = Array.isArray(input.items)
    ? input.items
    : Array.isArray(input.selectedItems)
      ? input.selectedItems
      : []

  const sources = rawItems.map((item, index): NormalizedPodcastSource => {
    const row = asRecord(item)
    const data = asRecord(row.data)
    const id = stringFrom(row.id) || `source-${index + 1}`
    const title =
      stringFrom(row.title) ||
      stringFrom(data.title) ||
      stringFrom(data.source_title_snapshot) ||
      `Source ${index + 1}`
    const bodyKind =
      stringFrom(row.bodyKind) ||
      stringFrom(row.body_kind) ||
      stringFrom(data.bodyKind) ||
      stringFrom(data.body_kind) ||
      "unknown"
    const sourceDocumentUid =
      stringFrom(row.sourceDocumentUid) ||
      stringFrom(row.source_document_uid) ||
      stringFrom(data.sourceDocumentUid) ||
      stringFrom(data.source_document_uid) ||
      stringFrom(data.document_uid) ||
      null
    const userNote =
      stringFrom(row.userNote) ||
      stringFrom(row.user_note) ||
      stringFrom(data.userNote) ||
      stringFrom(data.user_note)

    return {
      id,
      title,
      bodyKind,
      sourceDocumentUid,
      userNote,
      text: sourceTextFromRow(row, data),
      articleFullText:
        stringFrom(row.articleFullText) ||
        stringFrom(data.articleFullText) ||
        stringFrom(row.fulltext) ||
        stringFrom(data.fulltext),
      articleSummary:
        stringFrom(row.articleSummary) ||
        stringFrom(data.articleSummary) ||
        stringFrom(data.summary),
      articleSubtitle:
        stringFrom(row.articleSubtitle) ||
        stringFrom(data.articleSubtitle) ||
        stringFrom(data.subtitle),
      articleMetadata: articleMetadataFromRow(row, data),
    }
  })

  return {
    sources,
    extraInstructions: stringFrom(input.extraInstructions ?? input.instructions),
  }
}

export function validatePodcastContext(
  request: NormalizedPodcastSummarizeRequest
): PodcastValidationResult {
  if (request.sources.length === 0) {
    return { ok: false, message: "At least one selected item is required" }
  }
  if (request.sources.length > PODCAST_MAX_SELECTED_ITEMS) {
    return {
      ok: false,
      message: `At most ${PODCAST_MAX_SELECTED_ITEMS} selected items can be used`,
    }
  }
  const assembled = assembleArtifactContext(
    podcastSourcesToArtifactInputs(request.sources)
  )
  if (!assembled.blocks) {
    return { ok: false, message: "Selected items must include text content" }
  }
  if (assembled.tooLarge) {
    return {
      ok: false,
      message:
        "Selected context is too large even after summarizing excerpts; please select fewer items",
    }
  }
  return { ok: true }
}

export function validatePodcastScript(script: string): PodcastValidationResult {
  const text = script.trim()
  if (!text) return { ok: false, message: "Podcast script is required" }
  const bytes = utf8ByteLength(text)
  if (bytes > PODCAST_MAX_TTS_INPUT_BYTES) {
    return {
      ok: false,
      message: `Podcast script is too long; maximum is ${PODCAST_MAX_TTS_INPUT_BYTES} UTF-8 bytes`,
    }
  }
  return { ok: true }
}

export function utf8ByteLength(text: string): number {
  return Buffer.byteLength(text, "utf8")
}

export function fitTextToUtf8Bytes(
  text: string,
  maxBytes = PODCAST_MAX_TTS_INPUT_BYTES
): string {
  const trimmed = text.trim()
  if (utf8ByteLength(trimmed) <= maxBytes) return trimmed

  let out = ""
  for (const char of trimmed) {
    const next = out + char
    if (utf8ByteLength(next) > maxBytes) break
    out = next
  }

  const sentenceEnd = Math.max(
    out.lastIndexOf("."),
    out.lastIndexOf("!"),
    out.lastIndexOf("?"),
    out.lastIndexOf("\n")
  )
  if (sentenceEnd > Math.floor(out.length * 0.6)) {
    return out.slice(0, sentenceEnd + 1).trim()
  }
  return out.trim()
}

export function buildPodcastPrompt(request: NormalizedPodcastSummarizeRequest): string {
  const assembled = assembleArtifactContext(
    podcastSourcesToArtifactInputs(request.sources)
  )

  const extra = request.extraInstructions
    ? `\n\nExtra user instructions:\n${request.extraInstructions}`
    : ""

  return `You are creating a concise podcast script for technical staff working on climate change adaptation.

Use only the selected sources below. Preserve source boundaries while reasoning, avoid unsupported claims, and write for spoken audio rather than a written report.

${assembled.guidance}

Create an editable single-speaker script with:
1. A short intro that frames the selected material.
2. Three to five clear segments with smooth transitions.
3. Concrete adaptation insights, examples, and caveats from the sources.
4. A brief outro with practical takeaways.

Keep the tone professional, accessible, and natural when read aloud. Do not include markdown tables.

Hard length constraint: the final script MUST be at most ${PODCAST_SUMMARY_TARGET_BYTES} UTF-8 bytes so it can be sent to Google Text-to-Speech without truncation. Prefer a focused two-minute script over exhaustive coverage.

Selected sources:
${assembled.blocks}${extra}`
}

export function sourcePinIdsFromSources(sources: NormalizedPodcastSource[]): string[] {
  return sources
    .map((source) => source.id)
    .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
}
