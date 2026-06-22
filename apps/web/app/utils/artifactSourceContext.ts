/**
 * Shared, document-centric assembly of LLM context for generated artifacts
 * (PowerPoint decks and podcast scripts).
 *
 * Pure module (no Nuxt runtime deps) so it can be imported by both the client
 * selection utilities and the server prompt builders, keeping the prompt
 * structure, provenance labelling, token budgeting, and degradation policy in a
 * single source of truth.
 */

export type ArtifactFormat = "presentation" | "podcast"

export type SourceProvenance =
  | "primary_source"
  | "user_highlight"
  | "derived_synthesis"
  | "visual_asset"

/** Pins whose text is a deliberate slice of a parent article. */
export const FRAGMENT_BODY_KINDS = new Set([
  "selected_text",
  "text_segment",
  "recipe_section",
])

/** Pins that are the user's prior synthesis, not an original source. */
export const DERIVED_BODY_KINDS = new Set([
  "ai_summary",
  "grid_compare_summary",
  "markmap",
  "chat_response",
])

/** Pins that carry no useful text for either artifact format. */
export const EXCLUDED_BODY_KINDS = new Set(["contact", "website"])

/** ~50% of the model context window, expressed as a character-equivalent. */
export const ARTIFACT_MAX_CONTEXT_CHARS = 500_000

/** Shared item-count ceiling for a single artifact request. */
export const ARTIFACT_MAX_SELECTED_ITEMS = 12

export interface ArtifactArticleMetadata {
  keywords?: string[]
  climateImpacts?: string[]
  adaptationApproaches?: string[]
  sectors?: string[]
}

export interface ArtifactSourceInput {
  id: string
  title: string
  bodyKind: string
  sourceDocumentUid: string | null
  userNote: string
  /** The pin's own content: an excerpt for fragments, full text for documents. */
  text: string
  /** Parent article full text, when it could be resolved. */
  articleFullText?: string
  articleSummary?: string
  articleSubtitle?: string
  articleMetadata?: ArtifactArticleMetadata
  /** Image pins carry no text; handled separately by the presentation flow. */
  isImage?: boolean
}

export interface AssembledArtifactContext {
  /** False only when the selection cannot be made to fit the budget. */
  ok: boolean
  tooLarge: boolean
  /** Rendered, tagged source blocks ready to embed in a prompt. */
  blocks: string
  /** Guidance paragraph telling the model how to weight each provenance. */
  guidance: string
  /** True when at least one source was reduced to its summary to fit. */
  usedSummaries: boolean
  /** Estimated tokens at the ideal (pre-degradation) level of detail. */
  idealEstimatedTokens: number
  /** Estimated tokens of the assembled (possibly degraded) context. */
  estimatedTokens: number
}

type SourceLevel = "full_text" | "summary_only" | "fragment_only"

interface SourceGroup {
  uid: string | null
  order: number
  members: ArtifactSourceInput[]
  hasDocumentPin: boolean
  highlights: string[]
  notes: string[]
  derived: string[]
  memberIds: string[]
  title: string
  articleFullText: string
  articleSummary: string
  articleSubtitle: string
  metadata: ArtifactArticleMetadata
  /** Whether this group may be downgraded full_text -> summary_only. */
  degradable: boolean
  level: SourceLevel
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed)
      out.push(trimmed)
    }
  }
  return out
}

export function estimateTokensFromChars(chars: number): number {
  return Math.ceil(Math.max(0, chars) / 4)
}

function metadataLine(metadata: ArtifactArticleMetadata): string {
  const parts: string[] = []
  const push = (label: string, values?: string[]) => {
    const cleaned = uniqueNonEmpty(values ?? [])
    if (cleaned.length) parts.push(`${label}: ${cleaned.join(", ")}`)
  }
  push("Climate impacts", metadata.climateImpacts)
  push("Adaptation approaches", metadata.adaptationApproaches)
  push("Sectors", metadata.sectors)
  push("Keywords", metadata.keywords)
  return parts.join("; ")
}

function hasMetadata(metadata: ArtifactArticleMetadata): boolean {
  return Boolean(metadataLine(metadata))
}

/** Build the summary body for a degraded source, never returning empty. */
function summaryFallback(group: SourceGroup): string {
  if (group.articleSummary.trim()) return group.articleSummary.trim()

  const excerptParts: string[] = []
  if (group.articleSubtitle.trim()) excerptParts.push(group.articleSubtitle.trim())
  if (group.articleFullText.trim()) {
    excerptParts.push(group.articleFullText.trim().slice(0, 1_200))
  }
  const excerpt = excerptParts.join("\n").trim()
  if (excerpt) return excerpt

  const meta = metadataLine(group.metadata)
  return meta || "(no summary available)"
}

function provenanceFor(group: SourceGroup): SourceProvenance {
  if (group.hasDocumentPin) return "primary_source"
  if (group.highlights.length) return "user_highlight"
  return "derived_synthesis"
}

function renderUserFocus(group: SourceGroup): string {
  if (!group.highlights.length && !group.notes.length) return ""
  const lines: string[] = ["  <user_focus>"]
  if (group.highlights.length) {
    lines.push(
      "    The user read this article and deliberately selected the following passage(s) — treat these as the most important parts and make sure the output reflects them:"
    )
    for (const highlight of group.highlights) {
      lines.push(`      • ${highlight.replace(/\s+/g, " ").trim()}`)
    }
  }
  for (const note of group.notes) {
    lines.push(`    User note: ${note}`)
  }
  lines.push("  </user_focus>")
  return lines.join("\n")
}

function renderDerived(group: SourceGroup): string {
  if (!group.derived.length) return ""
  const lines: string[] = [
    "  <derived_context>",
    "    The user's earlier synthesis of this material (framing only, not independent evidence):",
  ]
  for (const item of group.derived) {
    lines.push(`    - ${item.trim()}`)
  }
  lines.push("  </derived_context>")
  return lines.join("\n")
}

function renderGroup(group: SourceGroup, index: number): string {
  const lines: string[] = [
    `<source index="${index}" provenance="${provenanceFor(group)}">`,
    `  <title>${group.title}</title>`,
  ]
  if (group.uid) lines.push(`  <document_uid>${group.uid}</document_uid>`)
  if (group.memberIds.length) {
    lines.push(`  <source_ids>${group.memberIds.join(", ")}</source_ids>`)
  }

  const focus = renderUserFocus(group)
  if (focus) lines.push(focus)

  const derived = renderDerived(group)
  if (derived) lines.push(derived)

  if (hasMetadata(group.metadata)) {
    lines.push(`  <metadata>${metadataLine(group.metadata)}</metadata>`)
  }

  if (group.level === "full_text" && group.articleFullText.trim()) {
    lines.push("  <full_text>", group.articleFullText.trim(), "  </full_text>")
  } else if (group.level === "summary_only") {
    lines.push(
      "  <note_to_model>Full article text was omitted to fit the context budget. The summary below is not the full body; ground claims in the verbatim highlights above and use the summary only for surrounding context.</note_to_model>",
      "  <summary>",
      summaryFallback(group),
      "  </summary>"
    )
  } else if (group.level === "fragment_only" && group.articleFullText.trim()) {
    // No parent article resolved; the highlights/derived text above is all we have.
    lines.push("  <text>", group.articleFullText.trim(), "  </text>")
  }

  lines.push("</source>")
  return lines.join("\n")
}

function renderLoose(source: ArtifactSourceInput, index: number): string {
  const provenance: SourceProvenance = FRAGMENT_BODY_KINDS.has(source.bodyKind)
    ? "user_highlight"
    : DERIVED_BODY_KINDS.has(source.bodyKind)
      ? "derived_synthesis"
      : "primary_source"
  const lines: string[] = [
    `<source index="${index}" provenance="${provenance}">`,
    `  <title>${source.title}</title>`,
    `  <source_ids>${source.id}</source_ids>`,
  ]
  if (source.userNote.trim()) {
    lines.push(`  <user_focus>\n    User note: ${source.userNote.trim()}\n  </user_focus>`)
  }
  lines.push("  <text>", source.text.trim(), "  </text>", "</source>")
  return lines.join("\n")
}

export const ARTIFACT_CONTEXT_GUIDANCE = `How to use the material:
- <full_text> is the authoritative source. Base all facts on it and do not invent claims it does not support.
- <user_focus> marks what the user deliberately highlighted or noted. Treat these as priorities — the output must clearly cover them, using the rest of the article as supporting context.
- <derived_context> is the user's earlier synthesis (AI summaries, mind maps, chat answers). Use it to understand their angle, but do not treat it as new evidence and do not double-count it.
- <summary> appears only when full text was omitted to fit the budget; rely on the verbatim highlights for specifics.
- Respect source boundaries: never merge facts across different articles or attribute one article's findings to another.`

function buildGroups(sources: ArtifactSourceInput[]): {
  groups: SourceGroup[]
  loose: ArtifactSourceInput[]
} {
  const groupsByUid = new Map<string, SourceGroup>()
  const groups: SourceGroup[] = []
  const loose: ArtifactSourceInput[] = []
  let order = 0

  for (const source of sources) {
    if (EXCLUDED_BODY_KINDS.has(source.bodyKind) || source.isImage) continue

    const uid = source.sourceDocumentUid?.trim() || null
    if (!uid) {
      if (source.text.trim()) loose.push(source)
      continue
    }

    let group = groupsByUid.get(uid)
    if (!group) {
      group = {
        uid,
        order: order++,
        members: [],
        hasDocumentPin: false,
        highlights: [],
        notes: [],
        derived: [],
        memberIds: [],
        title: source.title,
        articleFullText: "",
        articleSummary: "",
        articleSubtitle: "",
        metadata: {},
        degradable: false,
        level: "full_text",
      }
      groupsByUid.set(uid, group)
      groups.push(group)
    }

    group.members.push(source)
    group.memberIds.push(source.id)
    if (source.bodyKind === "document") group.hasDocumentPin = true
    if (FRAGMENT_BODY_KINDS.has(source.bodyKind) && source.text.trim()) {
      group.highlights.push(source.text)
    } else if (DERIVED_BODY_KINDS.has(source.bodyKind) && source.text.trim()) {
      group.derived.push(source.text)
    }
    if (source.userNote.trim()) group.notes.push(source.userNote)

    const fullText = source.articleFullText?.trim() || ""
    if (fullText && fullText.length > group.articleFullText.length) {
      group.articleFullText = fullText
    }
    if (!group.articleFullText && source.bodyKind === "document" && source.text.trim()) {
      group.articleFullText = source.text.trim()
    }
    if (source.articleSummary?.trim()) group.articleSummary = source.articleSummary.trim()
    if (source.articleSubtitle?.trim()) group.articleSubtitle = source.articleSubtitle.trim()
    if (source.articleMetadata) {
      group.metadata = { ...group.metadata, ...source.articleMetadata }
    }
  }

  for (const group of groups) {
    group.highlights = uniqueNonEmpty(group.highlights)
    group.notes = uniqueNonEmpty(group.notes)
    group.derived = uniqueNonEmpty(group.derived)
    if (group.articleFullText) {
      group.level = "full_text"
      // Only fragment-backed groups may be degraded; full-document pins never.
      group.degradable = !group.hasDocumentPin
    } else {
      group.level = "fragment_only"
      group.degradable = false
    }
  }

  return { groups, loose }
}

function renderAll(groups: SourceGroup[], loose: ArtifactSourceInput[]): string {
  const parts: string[] = []
  let index = 1
  for (const group of groups) parts.push(renderGroup(group, index++))
  for (const source of loose) parts.push(renderLoose(source, index++))
  return parts.join("\n\n---\n\n")
}

/**
 * Assemble selected sources into a document-centric, provenance-labelled prompt
 * body, deduplicating by source document and degrading fragment-backed sources
 * to summaries when the context exceeds the token budget.
 */
export function assembleArtifactContext(
  sources: ArtifactSourceInput[]
): AssembledArtifactContext {
  const { groups, loose } = buildGroups(sources)

  const idealChars = renderAll(groups, loose).length

  // Degrade fragment-backed groups (full_text -> summary_only) until within budget.
  let blocks = renderAll(groups, loose)
  while (
    blocks.length > ARTIFACT_MAX_CONTEXT_CHARS &&
    groups.some((group) => group.degradable && group.level === "full_text")
  ) {
    const target = groups.find(
      (group) => group.degradable && group.level === "full_text"
    )
    if (!target) break
    target.level = "summary_only"
    blocks = renderAll(groups, loose)
  }

  const usedSummaries = groups.some((group) => group.level === "summary_only")
  const tooLarge = blocks.length > ARTIFACT_MAX_CONTEXT_CHARS

  return {
    ok: !tooLarge,
    tooLarge,
    blocks,
    guidance: ARTIFACT_CONTEXT_GUIDANCE,
    usedSummaries,
    idealEstimatedTokens: estimateTokensFromChars(idealChars),
    estimatedTokens: estimateTokensFromChars(blocks.length),
  }
}
