import { describe, expect, it } from "vitest"
import {
  ARTIFACT_MAX_CONTEXT_CHARS,
  assembleArtifactContext,
  estimateTokensFromChars,
  type ArtifactSourceInput,
} from "../../app/utils/artifactSourceContext"

function source(overrides: Partial<ArtifactSourceInput>): ArtifactSourceInput {
  return {
    id: "pin-1",
    title: "Coastal adaptation",
    bodyKind: "selected_text",
    sourceDocumentUid: "doc-1",
    userNote: "",
    text: "Mangroves reduce wave energy.",
    articleFullText: "Full article body about mangroves and coastal defence.",
    articleSummary: "Mangroves protect coasts.",
    articleSubtitle: "",
    articleMetadata: { sectors: ["coastal"], keywords: ["mangrove"] },
    ...overrides,
  }
}

describe("assembleArtifactContext", () => {
  it("frames a highlight with its full article and user intent", () => {
    const result = assembleArtifactContext([source({})])
    expect(result.ok).toBe(true)
    expect(result.blocks).toContain('provenance="user_highlight"')
    expect(result.blocks).toContain("<user_focus>")
    expect(result.blocks).toContain("Mangroves reduce wave energy.")
    expect(result.blocks).toContain("<full_text>")
    expect(result.blocks).toContain("Full article body about mangroves")
  })

  it("deduplicates multiple fragments from the same article into one source", () => {
    const result = assembleArtifactContext([
      source({ id: "pin-a", text: "Highlight A" }),
      source({ id: "pin-b", text: "Highlight B" }),
      source({
        id: "pin-c",
        bodyKind: "ai_summary",
        text: "An earlier summary",
      }),
    ])
    expect(result.blocks.match(/<source /g)).toHaveLength(1)
    expect(result.blocks.match(/<full_text>/g)).toHaveLength(1)
    expect(result.blocks).toContain("Highlight A")
    expect(result.blocks).toContain("Highlight B")
    expect(result.blocks).toContain("<derived_context>")
    expect(result.blocks).toContain("pin-a, pin-b, pin-c")
  })

  it("labels a full-document pin as a primary source", () => {
    const result = assembleArtifactContext([
      source({ bodyKind: "document", text: "Full article body", userNote: "" }),
    ])
    expect(result.blocks).toContain('provenance="primary_source"')
  })

  it("excludes contact, website, and image pins from text", () => {
    const result = assembleArtifactContext([
      source({ id: "c", bodyKind: "contact", sourceDocumentUid: null, text: "Jane Doe" }),
      source({ id: "w", bodyKind: "website", sourceDocumentUid: null, text: "https://x" }),
      source({ id: "i", isImage: true, sourceDocumentUid: null, text: "alt text" }),
    ])
    expect(result.blocks).toBe("")
  })

  it("degrades fragment-backed sources to summaries when over budget", () => {
    const big = "x".repeat(ARTIFACT_MAX_CONTEXT_CHARS)
    const result = assembleArtifactContext([
      source({ id: "p1", sourceDocumentUid: "d1", articleFullText: big }),
      source({ id: "p2", sourceDocumentUid: "d2", articleFullText: big }),
    ])
    expect(result.ok).toBe(true)
    expect(result.usedSummaries).toBe(true)
    expect(result.blocks).toContain("<summary>")
    expect(result.blocks).toContain("Mangroves reduce wave energy.")
  })

  it("never degrades full-document pins and reports too large", () => {
    const big = "x".repeat(ARTIFACT_MAX_CONTEXT_CHARS)
    const result = assembleArtifactContext([
      source({ id: "p1", bodyKind: "document", sourceDocumentUid: "d1", articleFullText: big, text: big }),
      source({ id: "p2", bodyKind: "document", sourceDocumentUid: "d2", articleFullText: big, text: big }),
    ])
    expect(result.tooLarge).toBe(true)
    expect(result.ok).toBe(false)
    expect(result.blocks).not.toContain("<summary>")
    expect(result.blocks.match(/<full_text>/g)).toHaveLength(2)
  })

  it("keeps structured metadata after degradation", () => {
    const big = "x".repeat(ARTIFACT_MAX_CONTEXT_CHARS)
    const result = assembleArtifactContext([
      source({ id: "p1", sourceDocumentUid: "d1", articleFullText: big }),
      source({ id: "p2", sourceDocumentUid: "d2", articleFullText: big }),
    ])
    expect(result.blocks).toContain("<metadata>")
  })

  it("falls back to metadata when a degraded source has no summary", () => {
    const big = "x".repeat(ARTIFACT_MAX_CONTEXT_CHARS)
    const result = assembleArtifactContext([
      source({ id: "p1", sourceDocumentUid: "d1", articleFullText: big, articleSummary: "" }),
      source({ id: "p2", sourceDocumentUid: "d2", articleFullText: big, articleSummary: "" }),
    ])
    expect(result.usedSummaries).toBe(true)
    expect(result.blocks).not.toContain("(no summary available)")
    expect(result.blocks).toContain("Sectors: coastal")
  })

  it("estimates tokens as characters divided by four", () => {
    expect(estimateTokensFromChars(400)).toBe(100)
  })
})
