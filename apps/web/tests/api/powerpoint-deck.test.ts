import { describe, expect, it } from "vitest"
import type { PresentationStructure } from "../../app/types/presentationGeneration"
import {
  buildPowerPointDeck,
  powerPointDeckToBlob,
  POWERPOINT_MIME_TYPE,
  type PptxPresentationLike,
} from "../../app/utils/powerPointDeck"

function fakePresentation() {
  const slides: Array<{ options: unknown; calls: Array<{ name: string; args: unknown[] }> }> = []
  const pres: PptxPresentationLike = {
    addSlide: (options?: unknown) => {
      const calls: Array<{ name: string; args: unknown[] }> = []
      slides.push({ options, calls })
      return {
        addText: (...args: unknown[]) => calls.push({ name: "addText", args }),
        addImage: (...args: unknown[]) => calls.push({ name: "addImage", args }),
        addShape: (...args: unknown[]) => calls.push({ name: "addShape", args }),
      }
    },
    defineSlideMaster: () => undefined,
    write: async () => new Blob(["pptx"], { type: POWERPOINT_MIME_TYPE }),
  }
  return { pres, slides }
}

describe("PowerPoint deck builder", () => {
  it("dispatches every supported slide type to a layout", () => {
    const fake = fakePresentation()
    const doc: PresentationStructure = {
      title: "Adaptation briefing",
      slides: [
        { type: "cover", title: "Adaptation briefing" },
        { type: "bullets", title: "Key points", bullets: ["Restore mangroves"] },
        {
          type: "image-title",
          title: "Site",
          image: { sourceId: "image-1", alt: "Site" },
        },
        {
          type: "image-bullets",
          title: "Why it matters",
          image: { sourceId: "image-1", alt: "Site" },
          bullets: ["Buffers waves"],
        },
      ],
    }

    const deck = buildPowerPointDeck(doc, {
      createPresentation: () => fake.pres,
      images: {
        "image-1": {
          sourceId: "image-1",
          src: "https://example.test/image.jpg",
        },
      },
    })

    expect(deck.layout).toBe("LAYOUT_WIDE")
    expect(fake.slides).toHaveLength(4)
    expect(fake.slides.every((slide) => slide.options)).toBe(true)
    expect(fake.slides[0]?.calls.some((call) => call.name === "addText")).toBe(true)
    expect(fake.slides[2]?.calls.some((call) => call.name === "addImage")).toBe(true)
  })

  it("fails safely for unsupported slide types", () => {
    const fake = fakePresentation()
    const doc = {
      title: "Bad deck",
      slides: [{ type: "unknown", title: "No layout" }],
    } as unknown as PresentationStructure

    expect(() =>
      buildPowerPointDeck(doc, {
        createPresentation: () => fake.pres,
      })
    ).toThrow("Unsupported PowerPoint slide type: unknown")
  })

  it("exports a PowerPoint blob", async () => {
    const fake = fakePresentation()
    const blob = await powerPointDeckToBlob(fake.pres)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe(POWERPOINT_MIME_TYPE)
  })
})
