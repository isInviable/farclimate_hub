import { describe, expect, it, vi } from "vitest"
import {
  DEFAULT_GENERATIVE_MODEL_NAME,
  resolveLlmModelName,
} from "../../server/utils/llmModelConfig"
import {
  buildPresentationPrompt,
  normalizePresentationStructureRequest,
  PRESENTATION_MAX_CONTEXT_CHARS,
  PRESENTATION_MAX_SELECTED_ITEMS,
  PRESENTATION_MAX_SLIDES,
  runPresentationStructureGeneration,
  usablePresentationImages,
  validatePresentationRequest,
  validatePresentationStructure,
} from "../../server/utils/presentationStructure"

function textItem(id: string, text = "Mangroves reduce coastal wave energy.") {
  return {
    id,
    title: `Source ${id}`,
    bodyKind: "document",
    data: { markdown: text },
  }
}

function imageItem(id: string) {
  return {
    id,
    title: "Coastal mangrove image",
    bodyKind: "image",
    data: {
      src: "https://example.test/mangrove.jpg",
      alt: "Mangrove restoration site",
      caption: "Mangrove restoration",
      markdown: "A restored mangrove site protects the shoreline.",
    },
  }
}

describe("presentation structure request validation", () => {
  it("rejects empty selection before an LLM call is needed", () => {
    const request = normalizePresentationStructureRequest({ items: [] })

    expect(validatePresentationRequest(request)).toEqual({
      ok: false,
      message: "At least one selected item is required",
    })
  })

  it("rejects oversized selected item count and context", () => {
    const tooManyItems = normalizePresentationStructureRequest({
      items: Array.from({ length: PRESENTATION_MAX_SELECTED_ITEMS + 1 }, (_, index) =>
        textItem(`source-${index + 1}`)
      ),
    })
    expect(validatePresentationRequest(tooManyItems)).toEqual({
      ok: false,
      message: `At most ${PRESENTATION_MAX_SELECTED_ITEMS} selected items can be used`,
    })

    const oversized = normalizePresentationStructureRequest({
      items: [textItem("source-1", "x".repeat(PRESENTATION_MAX_CONTEXT_CHARS + 1))],
    })
    expect(validatePresentationRequest(oversized)).toEqual({
      ok: false,
      message: `Selected text is too long; maximum is ${PRESENTATION_MAX_CONTEXT_CHARS} characters`,
    })
  })

  it("rejects invalid requested slide count", () => {
    const request = normalizePresentationStructureRequest({
      requestedSlideCount: PRESENTATION_MAX_SLIDES + 1,
      items: [textItem("source-1")],
    })

    expect(validatePresentationRequest(request)).toEqual({
      ok: false,
      message: `At most ${PRESENTATION_MAX_SLIDES} slides can be requested`,
    })
  })

  it("keeps structured user instructions for the prompt", () => {
    const request = normalizePresentationStructureRequest({
      instructions: {
        tone: "executive",
        language: "Spanish",
        audience: "city planners",
        slideCount: 6,
        extra: "Focus on implementation trade-offs.",
      },
      items: [textItem("source-1")],
    })

    expect(validatePresentationRequest(request).ok).toBe(true)
    const prompt = buildPresentationPrompt(request)
    expect(prompt).toContain("Generate at most 6 slides")
    expect(prompt).toContain("Tone: executive")
    expect(prompt).toContain("Language: Spanish")
    expect(prompt).toContain("Audience: city planners")
    expect(prompt).toContain("Focus on implementation trade-offs.")
  })
})

describe("presentation structure schema validation", () => {
  it("accepts valid supported slide variants", () => {
    const request = normalizePresentationStructureRequest({
      items: [textItem("source-1"), imageItem("image-1")],
    })
    const result = validatePresentationStructure(
      {
        title: "Coastal adaptation",
        slides: [
          { type: "cover", title: "Coastal adaptation", debugSourceIds: ["source-1"] },
          {
            type: "bullets",
            title: "Key moves",
            bullets: ["Restore mangroves"],
            debugSourceIds: ["source-1"],
          },
          {
            type: "image-title",
            title: "Restoration site",
            image: { sourceId: "image-1", alt: "Mangrove restoration site" },
            debugSourceIds: ["image-1"],
          },
          {
            type: "image-bullets",
            title: "Why it matters",
            image: { sourceId: "image-1", caption: "Mangrove restoration" },
            bullets: ["Buffers waves", "Supports biodiversity"],
          },
        ],
      },
      request
    )

    expect(result.ok).toBe(true)
  })

  it("rejects layout and renderer fields", () => {
    const request = normalizePresentationStructureRequest({
      items: [textItem("source-1")],
    })
    const result = validatePresentationStructure(
      {
        title: "Coastal adaptation",
        slides: [
          {
            type: "bullets",
            title: "Key moves",
            x: 1,
            y: 2,
            fontFace: "Arial",
            bullets: ["Restore mangroves"],
          },
        ],
      },
      request
    )

    expect(result).toEqual({
      ok: false,
      message: "LLM response did not match the presentation slide schema",
    })
  })

  it("rejects more than the maximum slide count", () => {
    const request = normalizePresentationStructureRequest({
      items: [textItem("source-1")],
    })
    const result = validatePresentationStructure(
      {
        title: "Too long",
        slides: Array.from({ length: PRESENTATION_MAX_SLIDES + 1 }, (_, index) => ({
          type: "cover",
          title: `Slide ${index + 1}`,
        })),
      },
      request
    )

    expect(result.ok).toBe(false)
  })
})

describe("presentation image gating and source references", () => {
  it("disallows image slide types when no usable image is selected", () => {
    const request = normalizePresentationStructureRequest({
      items: [textItem("source-1")],
    })

    expect(usablePresentationImages(request)).toEqual([])
    expect(buildPresentationPrompt(request)).toContain(
      "Do not emit image-title or image-bullets slides"
    )

    const result = validatePresentationStructure(
      {
        title: "Coastal adaptation",
        slides: [
          {
            type: "image-title",
            title: "Invented image",
            image: { sourceId: "source-1" },
          },
        ],
      },
      request
    )
    expect(result).toEqual({
      ok: false,
      message: "Slide references unavailable image source id: source-1",
    })
  })

  it("rejects invented image and debug source references", () => {
    const request = normalizePresentationStructureRequest({
      items: [textItem("source-1"), imageItem("image-1")],
    })

    expect(
      validatePresentationStructure(
        {
          title: "Coastal adaptation",
          slides: [
            {
              type: "image-title",
              title: "Unknown image",
              image: { sourceId: "invented-image" },
            },
          ],
        },
        request
      )
    ).toEqual({
      ok: false,
      message: "Slide references unavailable image source id: invented-image",
    })

    expect(
      validatePresentationStructure(
        {
          title: "Coastal adaptation",
          slides: [
            {
              type: "bullets",
              title: "Unknown source",
              bullets: ["Unsupported claim"],
              debugSourceIds: ["invented-source"],
            },
          ],
        },
        request
      )
    ).toEqual({
      ok: false,
      message: "Slide references unknown debug source id: invented-source",
    })
  })
})

describe("presentation provider orchestration", () => {
  it("resolves the slideshow model from central model configuration", () => {
    expect(
      resolveLlmModelName(
        { slideshow_model_name: " gemini-custom-slideshow " },
        "slideshow_model_name"
      )
    ).toBe("gemini-custom-slideshow")

    expect(resolveLlmModelName({}, "slideshow_model_name")).toBe(
      DEFAULT_GENERATIVE_MODEL_NAME
    )
  })

  it("passes the prompt and validates mocked provider success", async () => {
    const request = normalizePresentationStructureRequest({
      instructions: "Make it executive and concise.",
      items: [textItem("source-1")],
    })
    const generate = vi.fn(async () => ({
      title: "Adaptation briefing",
      slides: [
        { type: "cover", title: "Adaptation briefing" },
        {
          type: "bullets",
          title: "Main point",
          bullets: ["Mangroves reduce coastal wave energy."],
          debugSourceIds: ["source-1"],
        },
      ],
    }))

    const presentation = await runPresentationStructureGeneration({
      request,
      modelName: "test-model",
      generate,
    })

    expect(presentation.title).toBe("Adaptation briefing")
    expect(generate).toHaveBeenCalledWith({
      modelName: "test-model",
      prompt: expect.stringContaining("Make it executive and concise."),
    })
  })

  it("returns validation errors for provider invalid JSON-shaped output", async () => {
    const request = normalizePresentationStructureRequest({
      items: [textItem("source-1")],
    })

    await expect(
      runPresentationStructureGeneration({
        request,
        generate: async () => "not an object",
      })
    ).rejects.toThrow("LLM response did not match the presentation slide schema")
  })
})
