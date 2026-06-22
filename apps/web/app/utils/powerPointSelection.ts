import type { PresentationSelectedSource } from "~/types/presentationGeneration"
import type { HumanPinRow } from "~/types/pins"
import { countWords, type ResolvedDocumentContext } from "./podcastSelection"
import {
  ARTIFACT_MAX_CONTEXT_CHARS,
  ARTIFACT_MAX_SELECTED_ITEMS,
  EXCLUDED_BODY_KINDS,
} from "~/utils/artifactSourceContext"

export const POWERPOINT_MAX_SELECTED_ITEMS = ARTIFACT_MAX_SELECTED_ITEMS
export const POWERPOINT_MAX_CONTEXT_CHARS = ARTIFACT_MAX_CONTEXT_CHARS
export const POWERPOINT_MAX_SLIDES = 10

export interface PowerPointSourcePreview {
  source: PresentationSelectedSource
  title: string
  textLength: number
  wordCount: number
  imageSrc: string | null
}

export interface PowerPointSelectionValidation {
  ok: boolean
  code?: "empty" | "too_many_items" | "empty_text" | "too_much_text"
  params?: Record<string, number>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function textFromMessages(value: unknown): string {
  if (!Array.isArray(value)) return ""
  return value
    .map((message) => {
      const row = asRecord(message)
      return stringFrom(row.text) || stringFrom(row.content)
    })
    .filter(Boolean)
    .join("\n")
    .trim()
}

export function powerPointTextFromPin(
  pin: HumanPinRow,
  context?: ResolvedDocumentContext
): string {
  if (pin.body_kind === "document" && context?.fulltext.trim()) {
    return context.fulltext.trim()
  }

  const data = asRecord(pin.body?.data)
  const candidates = [
    data.markdown,
    data.quote,
    data.fulltext,
    data.description,
    data.summary,
    data.text,
    data.content,
    data.caption,
    data.alt,
    textFromMessages(data.messages),
  ]
  return candidates.map(stringFrom).find(Boolean) ?? ""
}

export function powerPointImageSrcFromPin(pin: HumanPinRow): string | null {
  const data = asRecord(pin.body?.data)
  const kind = pin.body_kind.toLowerCase()
  const src =
    stringFrom(data.src) ||
    stringFrom(data.imageUrl) ||
    stringFrom(data.image_url) ||
    stringFrom(data.url)
  if (!src) return null
  if (kind.includes("image") || stringFrom(data.type).toLowerCase() === "image") {
    return src
  }
  return null
}

export function powerPointSourceFromPin(
  pin: HumanPinRow,
  context?: ResolvedDocumentContext
): PowerPointSourcePreview {
  const data = asRecord(pin.body?.data)
  const text = powerPointTextFromPin(pin, context)
  const title =
    pin.source_title_snapshot?.trim() ||
    stringFrom(data.title) ||
    stringFrom(data.label) ||
    "(no title)"
  const imageSrc = powerPointImageSrcFromPin(pin)

  return {
    title,
    textLength: text.length,
    wordCount: countWords(text),
    imageSrc,
    source: {
      id: pin.id,
      title,
      bodyKind: pin.body_kind,
      sourceDocumentUid: pin.source_document_uid,
      userNote: pin.user_note,
      text,
      data: {
        ...data,
        ...(imageSrc ? { src: imageSrc } : {}),
      },
      articleFullText: context?.fulltext ?? null,
      articleSummary: context?.summary ?? null,
      articleSubtitle: context?.subtitle ?? null,
      articleMetadata: context?.metadata ?? null,
    },
  }
}

export function selectedPowerPointSources(
  pins: HumanPinRow[],
  selectedIds: string[],
  documentContextByUid: Record<string, ResolvedDocumentContext> = {}
): PowerPointSourcePreview[] {
  const byId = new Map(pins.map((pin) => [pin.id, pin]))
  return selectedIds
    .map((id) => byId.get(id))
    .filter((pin): pin is HumanPinRow => Boolean(pin))
    .filter((pin) => !EXCLUDED_BODY_KINDS.has(pin.body_kind))
    .map((pin) =>
      powerPointSourceFromPin(
        pin,
        pin.source_document_uid ? documentContextByUid[pin.source_document_uid] : undefined
      )
    )
}

export function totalPowerPointTextLength(sources: PowerPointSourcePreview[]): number {
  return sources.reduce((sum, item) => sum + item.textLength, 0)
}

export function totalPowerPointWords(sources: PowerPointSourcePreview[]): number {
  return sources.reduce((sum, item) => sum + item.wordCount, 0)
}

export function validatePowerPointSelection(
  sources: PowerPointSourcePreview[]
): PowerPointSelectionValidation {
  if (sources.length === 0) {
    return { ok: false, code: "empty" }
  }
  if (sources.length > POWERPOINT_MAX_SELECTED_ITEMS) {
    return {
      ok: false,
      code: "too_many_items",
      params: {
        max: POWERPOINT_MAX_SELECTED_ITEMS,
        current: sources.length,
      },
    }
  }

  const totalChars = totalPowerPointTextLength(sources)
  if (totalChars === 0) {
    return { ok: false, code: "empty_text" }
  }
  if (totalChars > POWERPOINT_MAX_CONTEXT_CHARS) {
    return {
      ok: false,
      code: "too_much_text",
      params: {
        max: POWERPOINT_MAX_CONTEXT_CHARS,
        current: totalChars,
      },
    }
  }
  return { ok: true }
}
