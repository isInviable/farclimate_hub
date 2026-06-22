import { describe, expect, it } from "vitest"
import type { HumanPinRow } from "../../app/types/pins"
import {
  POWERPOINT_MAX_CONTEXT_CHARS,
  POWERPOINT_MAX_SELECTED_ITEMS,
  powerPointImageSrcFromPin,
  powerPointSourceFromPin,
  selectedPowerPointSources,
  totalPowerPointWords,
  validatePowerPointSelection,
} from "../../app/utils/powerPointSelection"

function pin(overrides: Partial<HumanPinRow>): HumanPinRow {
  return {
    id: "pin-1",
    pinboard_id: "board-1",
    source_document_uid: "doc-1",
    source_title_snapshot: "Pinned source",
    body_kind: "selected_text",
    body: { v: 1, data: { quote: "Mangroves reduce wave energy." } },
    user_note: "Use this in the deck",
    sort_order: 0,
    created_at: "2026-04-30T00:00:00.000Z",
    updated_at: "2026-04-30T00:00:00.000Z",
    ...overrides,
  }
}

describe("PowerPoint selected source helpers", () => {
  it("builds a structured presentation source from a pin", () => {
    const result = powerPointSourceFromPin(pin({}))

    expect(result.title).toBe("Pinned source")
    expect(result.wordCount).toBe(4)
    expect(result.source).toMatchObject({
      id: "pin-1",
      title: "Pinned source",
      bodyKind: "selected_text",
      sourceDocumentUid: "doc-1",
      userNote: "Use this in the deck",
      text: "Mangroves reduce wave energy.",
    })
  })

  it("preserves selected image source data", () => {
    const imagePin = pin({
      body_kind: "image",
      body: {
        v: 1,
        data: {
          src: "https://example.test/image.jpg",
          alt: "Mangrove site",
          caption: "Restoration image",
          markdown: "A restored site.",
        },
      },
    })

    expect(powerPointImageSrcFromPin(imagePin)).toBe("https://example.test/image.jpg")
    expect(powerPointSourceFromPin(imagePin).imageSrc).toBe("https://example.test/image.jpg")
  })

  it("keeps selected pin order and uses resolved full document text", () => {
    const pins = [
      pin({ id: "pin-a", body: { v: 1, data: { markdown: "A source" } } }),
      pin({
        id: "pin-b",
        body_kind: "document",
        source_document_uid: "doc-full",
        body: { v: 1, data: { pinned_as: "full_document" } },
      }),
    ]

    const result = selectedPowerPointSources(pins, ["pin-b", "missing", "pin-a"], {
      "doc-full": {
        fulltext: "Complete article text from the catalog.",
        summary: "",
        subtitle: "",
        metadata: {},
      },
    })

    expect(result.map((item) => item.source.id)).toEqual(["pin-b", "pin-a"])
    expect(result[0]?.source.text).toBe("Complete article text from the catalog.")
  })

  it("validates empty, oversized, and valid selections", () => {
    expect(validatePowerPointSelection([])).toMatchObject({
      ok: false,
      code: "empty",
    })

    const tooMany = Array.from({ length: POWERPOINT_MAX_SELECTED_ITEMS + 1 }, (_, index) =>
      powerPointSourceFromPin(pin({ id: `pin-${index}` }))
    )
    expect(validatePowerPointSelection(tooMany)).toMatchObject({
      ok: false,
      code: "too_many_items",
    })

    const tooLong = [
      powerPointSourceFromPin(
        pin({
          body: { v: 1, data: { markdown: "a".repeat(POWERPOINT_MAX_CONTEXT_CHARS + 1) } },
        })
      ),
    ]
    expect(validatePowerPointSelection(tooLong)).toMatchObject({
      ok: false,
      code: "too_much_text",
    })

    const valid = [powerPointSourceFromPin(pin({}))]
    expect(validatePowerPointSelection(valid)).toEqual({ ok: true })
    expect(totalPowerPointWords(valid)).toBe(4)
  })
})
