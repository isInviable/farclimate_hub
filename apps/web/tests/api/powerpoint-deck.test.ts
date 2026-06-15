import { describe, expect, it } from "vitest"
import type { PresentationStructure } from "../../app/types/presentationGeneration"
import {
  buildPowerPointDeck,
  definePowerPointMasters,
  powerPointDeckToBlob,
  POWERPOINT_MIME_TYPE,
  type PptxPresentationLike,
} from "../../app/utils/powerPointDeck"

function fakePresentation() {
  const slides: Array<{ options: unknown; calls: Array<{ name: string; args: unknown[] }> }> = []
  const masters: unknown[] = []
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
    defineSlideMaster: (options: unknown) => {
      masters.push(options)
    },
    write: async () => new Blob(["pptx"], { type: POWERPOINT_MIME_TYPE }),
  }
  return { pres, slides, masters }
}

describe("PowerPoint deck builder", () => {
  it("dispatches every supported slide type to a layout", () => {
    const fake = fakePresentation()
    const doc: PresentationStructure = {
      title: "Adaptation briefing",
      slides: [
        { type: "cover", title: "LLM cover title" },
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
      deckTitle: "User deck title",
      images: {
        "image-1": {
          sourceId: "image-1",
          src: "https://example.test/image.jpg",
        },
      },
    })

    expect(deck.layout).toBe("LAYOUT_WIDE")
    expect(fake.masters).toHaveLength(2)
    expect(fake.masters.map((m) => (m as { title: string }).title)).toEqual(["COVER", "CONTENT"])
    expect(fake.slides).toHaveLength(4)
    expect(fake.slides[0]?.options).toEqual({ masterName: "COVER" })
    expect(fake.slides[1]?.options).toEqual({ masterName: "CONTENT" })
    expect(fake.slides[0]?.calls.some((call) => call.name === "addText")).toBe(true)
    expect(fake.slides[2]?.calls.some((call) => call.name === "addImage")).toBe(true)

    const bulletsListCall = fake.slides[1]?.calls.find(
      (call) =>
        call.name === "addText" &&
        Array.isArray(call.args[0]) &&
        (call.args[0] as { options?: { bullet?: unknown } }[])[0]?.options?.bullet
    )
    const bulletItems = bulletsListCall?.args[0] as Array<{
      text: string
      options: { bullet?: { characterCode?: string } }
    }>
    expect(bulletItems?.[0]?.options.bullet?.characterCode).toBe("2022")
    expect(bulletItems?.[0]?.text).toBe("Restore mangroves")

    const coverTitleCall = fake.slides[0]?.calls.find((call) => call.name === "addText")
    expect(coverTitleCall?.args[0]).toBe("User deck title")
  })

  it("defines content master with slide numbers and branding", () => {
    const fake = fakePresentation()
    definePowerPointMasters(fake.pres, {
      deckTitle: "Regional briefing",
      brandName: "FARCLIMATE",
      logoData: "image/png;base64,abc",
    })

    const contentMaster = fake.masters.find((m) => (m as { title: string }).title === "CONTENT") as {
      slideNumber?: { align?: string }
      objects?: unknown[]
    }
    expect(contentMaster?.slideNumber?.align).toBe("right")
    expect(contentMaster?.objects?.length).toBeGreaterThan(3)
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
