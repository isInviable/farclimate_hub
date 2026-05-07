import { google } from "@ai-sdk/google"
import { generateText, Output } from "ai"
import { z } from "zod"
import type {
  PresentationGenerationInstructions,
  PresentationImageReference,
  PresentationSelectedSource,
  PresentationStructure,
} from "~/types/presentationGeneration"
import { DEFAULT_GENERATIVE_MODEL_NAME } from "./llmModelConfig"

export const PRESENTATION_MAX_SELECTED_ITEMS = 12
export const PRESENTATION_MAX_CONTEXT_CHARS = 60_000
export const PRESENTATION_MAX_SLIDES = 10

const optionalNonEmptyStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}, z.string().min(1).optional())

const debugSourceIdsSchema = z.array(z.string().trim().min(1)).optional()

const imageReferenceSchema = z.preprocess((value) => {
  if (Array.isArray(value) && value.length === 1) {
    const sourceId = stringFrom(value[0])
    return sourceId ? { sourceId } : value
  }
  if (typeof value !== "string") return value
  const sourceId = value.trim()
  return sourceId ? { sourceId } : value
}, z.object({
  sourceId: z.string().trim().min(1),
  alt: optionalNonEmptyStringSchema,
  caption: optionalNonEmptyStringSchema,
}).strict())

export const presentationStructureSchema = z.object({
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1).optional(),
  slides: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("cover"),
        title: z.string().trim().min(1),
        subtitle: z.string().trim().min(1).optional(),
        debugSourceIds: debugSourceIdsSchema,
      }).strict(),
      z.object({
        type: z.literal("bullets"),
        title: z.string().trim().min(1),
        bullets: z.array(z.string().trim().min(1)).min(1),
        debugSourceIds: debugSourceIdsSchema,
      }).strict(),
      z.object({
        type: z.literal("image-title"),
        title: z.string().trim().min(1),
        image: imageReferenceSchema,
        debugSourceIds: debugSourceIdsSchema,
      }).strict(),
      z.object({
        type: z.literal("image-bullets"),
        title: z.string().trim().min(1),
        image: imageReferenceSchema,
        bullets: z.array(z.string().trim().min(1)).min(1),
        debugSourceIds: debugSourceIdsSchema,
      }).strict(),
    ])
  ).min(1).max(PRESENTATION_MAX_SLIDES),
}).strict()

export interface NormalizedPresentationSource {
  id: string
  title: string
  bodyKind: string
  sourceDocumentUid: string | null
  userNote: string
  text: string
  image: PresentationImageReference | null
}

export interface NormalizedPresentationInstructions {
  tone: string
  language: string
  audience: string
  slideCount: number | null
  extra: string
}

export interface NormalizedPresentationStructureRequest {
  sources: NormalizedPresentationSource[]
  instructions: NormalizedPresentationInstructions
}

export interface PresentationValidationResult {
  ok: boolean
  message?: string
}

export interface GeneratePresentationStructureParams {
  request: NormalizedPresentationStructureRequest
  modelName?: string
  generate?: (params: {
    modelName: string
    prompt: string
  }) => Promise<unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function positiveIntegerFrom(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null
}

function sourceText(source: PresentationSelectedSource): string {
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
    data.caption,
    data.alt,
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

function instructionObjectFrom(value: unknown): PresentationGenerationInstructions {
  if (typeof value === "string") return { extra: value.trim() }
  const input = asRecord(value)
  return {
    tone: stringFrom(input.tone),
    language: stringFrom(input.language),
    audience: stringFrom(input.audience),
    slideCount: positiveIntegerFrom(input.slideCount ?? input.requestedSlideCount) ?? undefined,
    extra: stringFrom(input.extra ?? input.extraInstructions ?? input.prompt),
  }
}

function imageFromSource(
  id: string,
  bodyKind: string,
  row: Record<string, unknown>,
  data: Record<string, unknown>
): PresentationImageReference | null {
  const kind = bodyKind.toLowerCase()
  const url =
    stringFrom(row.imageUrl) ||
    stringFrom(row.image_url) ||
    stringFrom(row.src) ||
    stringFrom(data.imageUrl) ||
    stringFrom(data.image_url) ||
    stringFrom(data.src) ||
    stringFrom(data.url)
  const explicitImage =
    kind.includes("image") ||
    stringFrom(row.type).toLowerCase() === "image" ||
    stringFrom(data.type).toLowerCase() === "image" ||
    Boolean(stringFrom(data.imageUrl) || stringFrom(data.image_url) || stringFrom(data.src))

  if (!url || !explicitImage) return null

  return {
    sourceId: id,
    alt:
      stringFrom(row.alt) ||
      stringFrom(data.alt) ||
      stringFrom(data.alt_text) ||
      undefined,
    caption:
      stringFrom(row.caption) ||
      stringFrom(data.caption) ||
      stringFrom(data.title) ||
      undefined,
  }
}

export function normalizePresentationStructureRequest(
  body: unknown
): NormalizedPresentationStructureRequest {
  const input = asRecord(body)
  const rawItems = Array.isArray(input.items)
    ? input.items
    : Array.isArray(input.selectedItems)
      ? input.selectedItems
      : []
  const instructionInput = instructionObjectFrom(
    input.instructions ?? input.presentationInstructions ?? input.extraInstructions
  )
  const requestedSlideCount =
    positiveIntegerFrom(input.requestedSlideCount) ??
    positiveIntegerFrom(input.slideCount) ??
    instructionInput.slideCount ??
    null

  const sources = rawItems.map((item, index): NormalizedPresentationSource => {
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
      image: imageFromSource(id, bodyKind, row, data),
    }
  })

  return {
    sources,
    instructions: {
      tone: instructionInput.tone ?? "",
      language: instructionInput.language ?? "",
      audience: instructionInput.audience ?? "",
      slideCount: requestedSlideCount,
      extra: stringFrom(input.extraInstructions) || instructionInput.extra || "",
    },
  }
}

export function validatePresentationRequest(
  request: NormalizedPresentationStructureRequest
): PresentationValidationResult {
  if (request.sources.length === 0) {
    return { ok: false, message: "At least one selected item is required" }
  }
  if (request.sources.length > PRESENTATION_MAX_SELECTED_ITEMS) {
    return {
      ok: false,
      message: `At most ${PRESENTATION_MAX_SELECTED_ITEMS} selected items can be used`,
    }
  }
  const totalChars = request.sources.reduce((sum, source) => sum + source.text.length, 0)
  if (totalChars === 0) {
    return { ok: false, message: "Selected items must include text content" }
  }
  if (totalChars > PRESENTATION_MAX_CONTEXT_CHARS) {
    return {
      ok: false,
      message: `Selected text is too long; maximum is ${PRESENTATION_MAX_CONTEXT_CHARS} characters`,
    }
  }
  const requestedSlides = request.instructions.slideCount
  if (requestedSlides !== null && requestedSlides > PRESENTATION_MAX_SLIDES) {
    return {
      ok: false,
      message: `At most ${PRESENTATION_MAX_SLIDES} slides can be requested`,
    }
  }
  return { ok: true }
}

export function usablePresentationImages(
  request: NormalizedPresentationStructureRequest
): PresentationImageReference[] {
  return request.sources
    .map((source) => source.image)
    .filter((image): image is PresentationImageReference => image !== null)
}

export function validatePresentationStructure(
  value: unknown,
  request: NormalizedPresentationStructureRequest
): { ok: true; presentation: PresentationStructure } | { ok: false; message: string } {
  const parsed = presentationStructureSchema.safeParse(value)
  if (!parsed.success) {
    return {
      ok: false,
      message: "LLM response did not match the presentation slide schema",
    }
  }

  const selectedSourceIds = new Set(request.sources.map((source) => source.id))
  const usableImageSourceIds = new Set(
    usablePresentationImages(request).map((image) => image.sourceId)
  )

  for (const slide of parsed.data.slides) {
    const debugSourceIds = slide.debugSourceIds ?? []
    for (const sourceId of debugSourceIds) {
      if (!selectedSourceIds.has(sourceId)) {
        return {
          ok: false,
          message: `Slide references unknown debug source id: ${sourceId}`,
        }
      }
    }
    if (slide.type === "image-title" || slide.type === "image-bullets") {
      if (!usableImageSourceIds.has(slide.image.sourceId)) {
        return {
          ok: false,
          message: `Slide references unavailable image source id: ${slide.image.sourceId}`,
        }
      }
    }
  }

  return { ok: true, presentation: parsed.data }
}

export function buildPresentationPrompt(
  request: NormalizedPresentationStructureRequest
): string {
  const images = usablePresentationImages(request)
  const imageInstructions = images.length
    ? `Image slide types are allowed only with these selected image sourceIds: ${images
        .map((image) => image.sourceId)
        .join(", ")}. The image field must be a single object like { "sourceId": "selected-image-id" }, never a bare string and never an array. The image.sourceId field is a content handle, not a URL. Use exactly one of those ids. Do not emit src, url, path, data, or any other image location field. If alt or caption is unknown, omit the field instead of using null or an empty string.`
    : "Do not emit image-title or image-bullets slides because the selected sources do not include usable images."
  const requestedSlides = request.instructions.slideCount ?? PRESENTATION_MAX_SLIDES
  const instructionLines = [
    request.instructions.tone ? `Tone: ${request.instructions.tone}` : "",
    request.instructions.language ? `Language: ${request.instructions.language}` : "",
    request.instructions.audience ? `Audience: ${request.instructions.audience}` : "",
    request.instructions.extra ? `Extra: ${request.instructions.extra}` : "",
  ].filter(Boolean)
  const sourceBlocks = request.sources
    .map((source, index) => {
      const uid = source.sourceDocumentUid ?? "none"
      const note = source.userNote ? `\nUser note: ${source.userNote}` : ""
      const image = source.image
        ? `\nUsable image: sourceId=${source.image.sourceId}; alt=${source.image.alt ?? "none"}; caption=${source.image.caption ?? "none"}`
        : "\nUsable image: none"
      return `Source ${index + 1}
Source id: ${source.id}
Title: ${source.title}
Body kind: ${source.bodyKind}
Source document uid: ${uid}${note}${image}
Text:
${source.text}`
    })
    .join("\n\n---\n\n")

  const userInstructions = instructionLines.length
    ? `\n\nUser instructions:\n${instructionLines.join("\n")}`
    : ""

  return `You generate structured presentation outlines for climate change adaptation work.

Use only the selected sources below. Return only JSON matching the provided schema. Do not include markdown fences, commentary, citations for users, or rendering/layout data.

Supported slide types:
1. cover: { "type": "cover", "title": "...", "subtitle": "... optional", "debugSourceIds": ["source-id"] }
2. bullets: { "type": "bullets", "title": "...", "bullets": ["..."], "debugSourceIds": ["source-id"] }
3. image-title: { "type": "image-title", "title": "...", "image": { "sourceId": "...", "alt": "... optional", "caption": "... optional" }, "debugSourceIds": ["source-id"] }
4. image-bullets: { "type": "image-bullets", "title": "...", "image": { "sourceId": "...", "alt": "... optional", "caption": "... optional" }, "bullets": ["..."], "debugSourceIds": ["source-id"] }

Top-level response shape:
{ "title": "...", "subtitle": "... optional", "slides": [/* 1 to ${PRESENTATION_MAX_SLIDES} slides */] }

Rules:
- Generate at most ${Math.min(requestedSlides, PRESENTATION_MAX_SLIDES)} slides.
- Prefer concise slide titles and bullets suitable for a PowerPoint deck.
- debugSourceIds are for developers only and must refer to selected Source id values.
- Never invent source ids, image source ids, URLs, coordinates, fonts, colors, dimensions, or PptxGenJS options.
- Image slides must reference selected images as an image object with image.sourceId only. Do not set image to a string. The application will attach the actual image URL later.
- ${imageInstructions}

Selected sources:
${sourceBlocks}${userInstructions}`
}

export async function runPresentationStructureGeneration({
  request,
  modelName = DEFAULT_GENERATIVE_MODEL_NAME,
  generate,
}: GeneratePresentationStructureParams): Promise<PresentationStructure> {
  const prompt = buildPresentationPrompt(request)
  logPresentationDebug("request", request, prompt, modelName)
  const rawObject = generate
    ? await generate({ modelName, prompt })
    : await generatePresentationObject(modelName, prompt)
  const validation = validatePresentationStructure(rawObject, request)
  if (!validation.ok) {
    throw new Error(validation.message)
  }
  return validation.presentation
}

async function generatePresentationObject(
  modelName: string,
  prompt: string
): Promise<unknown> {
  let output: unknown
  try {
    const result = await generateText({
      model: google(modelName),
      prompt,
      output: Output.object({ schema: presentationStructureSchema }),
    })
    output = result.output
  } catch (error) {
    console.error("[presentation-structure] structured generation failed", {
      modelName,
      error: errorForLog(error),
    })
    throw error
  }
  if (!output) {
    throw new Error("Model did not return structured presentation output")
  }
  return output
}

function logPresentationDebug(
  event: string,
  request: NormalizedPresentationStructureRequest,
  prompt: string,
  modelName: string
) {
  const imageSources = usablePresentationImages(request)
  if (imageSources.length === 0 && process.env.NUXT_DEBUG_PRESENTATION_STRUCTURE !== "true") {
    return
  }
  console.info(`[presentation-structure] ${event}`, {
    modelName,
    sourceCount: request.sources.length,
    requestedSlideCount: request.instructions.slideCount,
    imageSourceCount: imageSources.length,
    imageSources,
    sourceSummary: request.sources.map((source) => ({
      id: source.id,
      title: source.title,
      bodyKind: source.bodyKind,
      textLength: source.text.length,
      hasImage: Boolean(source.image),
      image: source.image,
    })),
    promptImageRule: imageSources.length
      ? `allowed image sourceIds: ${imageSources.map((image) => image.sourceId).join(", ")}`
      : "image slides disallowed",
    promptLength: prompt.length,
  })
}

function errorForLog(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { value: String(error) }
  }
  const row = error as Error & {
    cause?: unknown
    value?: unknown
    response?: unknown
  }
  return {
    name: row.name,
    message: row.message,
    cause: safeLogValue(row.cause),
    value: safeLogValue(row.value),
    response: safeLogValue(row.response),
  }
}

function safeLogValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "string") return value.slice(0, 2_000)
  if (typeof value === "number" || typeof value === "boolean") return value
  try {
    return JSON.stringify(value).slice(0, 2_000)
  } catch {
    return String(value).slice(0, 2_000)
  }
}
