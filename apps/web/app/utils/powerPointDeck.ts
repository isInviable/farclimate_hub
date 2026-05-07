import pptxgen from "pptxgenjs"
import type {
  PresentationBulletsSlide,
  PresentationCoverSlide,
  PresentationImageBulletsSlide,
  PresentationImageTitleSlide,
  PresentationSlide,
  PresentationStructure,
} from "~/types/presentationGeneration"

export const POWERPOINT_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"

export interface PowerPointImageAsset {
  sourceId: string
  src?: string
  data?: string
  alt?: string
  caption?: string
}

export interface PowerPointDeckBuildOptions {
  images?: Record<string, PowerPointImageAsset>
  createPresentation?: () => PptxPresentationLike
}

export interface PptxPresentationLike {
  layout?: string
  title?: string
  subject?: string
  company?: string
  author?: string
  defineSlideMaster?: (options: any) => void
  addSlide: (options?: any) => PptxSlideLike
  write?: (options?: any) => Promise<unknown>
}

export interface PptxSlideLike {
  background?: unknown
  addText: (text: any, options?: any) => void
  addImage?: (options: any) => void
  addShape?: (shapeType: any, options?: any) => void
}

export type PowerPointLayoutFunction<T extends PresentationSlide = PresentationSlide> = (
  slide: PptxSlideLike,
  data: T,
  context: PowerPointLayoutContext
) => void

export interface PowerPointLayouts {
  cover: PowerPointLayoutFunction<PresentationCoverSlide>
  bullets: PowerPointLayoutFunction<PresentationBulletsSlide>
  "image-title": PowerPointLayoutFunction<PresentationImageTitleSlide>
  "image-bullets": PowerPointLayoutFunction<PresentationImageBulletsSlide>
}

export interface PowerPointLayoutContext {
  images: Record<string, PowerPointImageAsset>
}

const COLORS = {
  navy: "0F172A",
  slate: "475569",
  light: "F8FAFC",
  accent: "2563EB",
  muted: "E2E8F0",
}

function addFooter(slide: PptxSlideLike) {
  slide.addText("FarClimate", {
    x: 0.55,
    y: 7.0,
    w: 2.4,
    h: 0.25,
    fontSize: 8,
    color: COLORS.slate,
  })
}

function addTitle(slide: PptxSlideLike, title: string) {
  slide.addText(title, {
    x: 0.65,
    y: 0.45,
    w: 12.0,
    h: 0.65,
    fontSize: 26,
    bold: true,
    color: COLORS.navy,
    margin: 0,
    breakLine: false,
    fit: "shrink",
  })
}

function resolveImage(
  data: PresentationImageTitleSlide | PresentationImageBulletsSlide,
  context: PowerPointLayoutContext
): PowerPointImageAsset | null {
  const asset = context.images[data.image.sourceId]
  if (!asset) return null
  return asset.data || asset.src ? asset : null
}

function addImageOrFallback(
  slide: PptxSlideLike,
  data: PresentationImageTitleSlide | PresentationImageBulletsSlide,
  context: PowerPointLayoutContext,
  options: { x: number; y: number; w: number; h: number }
) {
  const image = resolveImage(data, context)
  if (image && slide.addImage) {
    slide.addImage({
      ...(image.data ? { data: image.data } : { path: image.src }),
      ...options,
    })
    return
  }

  slide.addShape?.("rect", {
    ...options,
    fill: { color: COLORS.light },
    line: { color: COLORS.muted },
  })
  slide.addText(data.image.alt || data.image.caption || "Image unavailable", {
    ...options,
    fontSize: 14,
    color: COLORS.slate,
    align: "center",
    valign: "mid",
    margin: 0.2,
    fit: "shrink",
  })
}

export const powerPointLayouts: PowerPointLayouts = {
  cover: (slide: PptxSlideLike, data: PresentationCoverSlide) => {
    slide.background = { color: COLORS.light }
    slide.addShape?.("rect", {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.18,
      fill: { color: COLORS.accent },
      line: { color: COLORS.accent },
    })
    slide.addText(data.title, {
      x: 0.85,
      y: 2.35,
      w: 11.6,
      h: 1.0,
      fontSize: 36,
      bold: true,
      color: COLORS.navy,
      align: "center",
      margin: 0,
      fit: "shrink",
    })
    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 1.4,
        y: 3.45,
        w: 10.5,
        h: 0.55,
        fontSize: 18,
        color: COLORS.slate,
        align: "center",
        margin: 0,
        fit: "shrink",
      })
    }
    addFooter(slide)
  },
  bullets: (slide: PptxSlideLike, data: PresentationBulletsSlide) => {
    addTitle(slide, data.title)
    slide.addText(
      data.bullets.map((bullet: string) => ({
        text: bullet,
        options: { bullet: { type: "ul" }, breakLine: true },
      })),
      {
        x: 0.85,
        y: 1.45,
        w: 11.6,
        h: 5.2,
        fontSize: 17,
        color: COLORS.navy,
        breakLine: false,
        margin: 0.08,
        fit: "shrink",
      }
    )
    addFooter(slide)
  },
  "image-title": (
    slide: PptxSlideLike,
    data: PresentationImageTitleSlide,
    context: PowerPointLayoutContext
  ) => {
    addTitle(slide, data.title)
    addImageOrFallback(slide, data, context, {
      x: 1.1,
      y: 1.35,
      w: 11.1,
      h: 5.35,
    })
    if (data.image.caption) {
      slide.addText(data.image.caption, {
        x: 1.1,
        y: 6.75,
        w: 11.1,
        h: 0.3,
        fontSize: 9,
        color: COLORS.slate,
        align: "center",
        fit: "shrink",
      })
    }
    addFooter(slide)
  },
  "image-bullets": (
    slide: PptxSlideLike,
    data: PresentationImageBulletsSlide,
    context: PowerPointLayoutContext
  ) => {
    addTitle(slide, data.title)
    addImageOrFallback(slide, data, context, {
      x: 0.75,
      y: 1.35,
      w: 5.45,
      h: 4.75,
    })
    slide.addText(
      data.bullets.map((bullet: string) => ({
        text: bullet,
        options: { bullet: { type: "ul" }, breakLine: true },
      })),
      {
        x: 6.55,
        y: 1.45,
        w: 5.9,
        h: 4.65,
        fontSize: 15,
        color: COLORS.navy,
        margin: 0.08,
        fit: "shrink",
      }
    )
    if (data.image.caption) {
      slide.addText(data.image.caption, {
        x: 0.75,
        y: 6.2,
        w: 5.45,
        h: 0.3,
        fontSize: 8,
        color: COLORS.slate,
        align: "center",
        fit: "shrink",
      })
    }
    addFooter(slide)
  },
}

export function definePowerPointMaster(pres: PptxPresentationLike) {
  pres.layout = "LAYOUT_WIDE"
  pres.author = "FarClimate"
  pres.company = "FarClimate"
  pres.defineSlideMaster?.({
    title: "BASE",
    background: { color: "FFFFFF" },
    objects: [
      {
        line: {
          x: 0.55,
          y: 6.9,
          w: 12.2,
          h: 0,
          line: { color: COLORS.muted, width: 1 },
        },
      },
    ],
  })
}

export function buildPowerPointDeck(
  doc: PresentationStructure,
  options: PowerPointDeckBuildOptions = {}
): PptxPresentationLike {
  const pres: PptxPresentationLike =
    options.createPresentation?.() ?? (new pptxgen() as unknown as PptxPresentationLike)
  pres.title = doc.title
  pres.subject = doc.subtitle ?? "Generated from selected pinboard items"
  definePowerPointMaster(pres)

  const context: PowerPointLayoutContext = {
    images: options.images ?? {},
  }

  for (const slideData of doc.slides) {
    switch (slideData.type) {
      case "cover":
        powerPointLayouts.cover(pres.addSlide({ masterName: "BASE" }), slideData, context)
        break
      case "bullets":
        powerPointLayouts.bullets(pres.addSlide({ masterName: "BASE" }), slideData, context)
        break
      case "image-title":
        powerPointLayouts["image-title"](pres.addSlide({ masterName: "BASE" }), slideData, context)
        break
      case "image-bullets":
        powerPointLayouts["image-bullets"](pres.addSlide({ masterName: "BASE" }), slideData, context)
        break
      default:
        throw new Error(
          `Unsupported PowerPoint slide type: ${(slideData as { type?: string }).type}`
        )
    }
  }

  return pres
}

export async function powerPointDeckToBlob(pres: PptxPresentationLike): Promise<Blob> {
  if (!pres.write) {
    throw new Error("PowerPoint presentation cannot be exported")
  }
  const output = await pres.write({ outputType: "blob" })
  if (output instanceof Blob) return output
  if (output instanceof ArrayBuffer) return new Blob([output], { type: POWERPOINT_MIME_TYPE })
  if (output instanceof Uint8Array) {
    const buffer = output.buffer.slice(
      output.byteOffset,
      output.byteOffset + output.byteLength
    ) as ArrayBuffer
    return new Blob([buffer], { type: POWERPOINT_MIME_TYPE })
  }
  throw new Error("PowerPoint export returned an unsupported output type")
}
