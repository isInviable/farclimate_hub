import type {
  PodcastSelectedSource,
  PodcastSummarizeRequest,
} from "~/types/podcastGeneration"

export const PODCAST_MAX_SELECTED_ITEMS = 12
export const PODCAST_MAX_CONTEXT_CHARS = 60_000
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
  const totalChars = request.sources.reduce((sum, source) => sum + source.text.length, 0)
  if (totalChars === 0) {
    return { ok: false, message: "Selected items must include text content" }
  }
  if (totalChars > PODCAST_MAX_CONTEXT_CHARS) {
    return {
      ok: false,
      message: `Selected text is too long; maximum is ${PODCAST_MAX_CONTEXT_CHARS} characters`,
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
  const sourceBlocks = request.sources
    .map((source, index) => {
      const uid = source.sourceDocumentUid ?? "none"
      const note = source.userNote ? `\nUser note: ${source.userNote}` : ""
      return `Source ${index + 1}
Pin id: ${source.id}
Title: ${source.title}
Body kind: ${source.bodyKind}
Source document uid: ${uid}${note}
Text:
${source.text}`
    })
    .join("\n\n---\n\n")

  const extra = request.extraInstructions
    ? `\n\nExtra user instructions:\n${request.extraInstructions}`
    : ""

  return `You are creating a concise podcast script for technical staff working on climate change adaptation.

Use only the selected sources below. Preserve source boundaries while reasoning, avoid unsupported claims, and write for spoken audio rather than a written report.

Create an editable single-speaker script with:
1. A short intro that frames the selected material.
2. Three to five clear segments with smooth transitions.
3. Concrete adaptation insights, examples, and caveats from the sources.
4. A brief outro with practical takeaways.

Keep the tone professional, accessible, and natural when read aloud. Do not include markdown tables.

Hard length constraint: the final script MUST be at most ${PODCAST_SUMMARY_TARGET_BYTES} UTF-8 bytes so it can be sent to Google Text-to-Speech without truncation. Prefer a focused two-minute script over exhaustive coverage.

Selected sources:
${sourceBlocks}${extra}`
}

export function sourcePinIdsFromSources(sources: NormalizedPodcastSource[]): string[] {
  return sources
    .map((source) => source.id)
    .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
}
