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

export const POWERPOINT_LOGO_PATH = "/img/icono-farclimate.png"

export const POWERPOINT_BRAND_NAME = "FARCLIMATE"

/** Wide 16:9 slide size (inches) for layout math */
const SLIDE_W = 13.333

/** Chrome bands — content layouts place body below HEADER_BOTTOM */
const HEADER_BOTTOM = 1.02
const FOOTER_TOP = 6.82

export interface PowerPointImageAsset {
  sourceId: string
  src?: string
  data?: string
  alt?: string
  caption?: string
}

export interface PowerPointDeckBuildOptions {
  images?: Record<string, PowerPointImageAsset>
  /** Shown in the header on content slides and as the cover main title */
  deckTitle?: string
  /** Base64 data URL for the logo (`image/png;base64,...`) */
  logoData?: string
  brandName?: string
  createPresentation?: () => PptxPresentationLike
}

export interface PptxPresentationLike {
  layout?: string
  title?: string
  subject?: string
  company?: string
  author?: string
  theme?: { headFontFace?: string; bodyFontFace?: string }
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
  deckTitle: string
  brandName: string
  logoData?: string
}

/** Warm palette inspired by the FARCLIMATE tree logo */
const COLORS = {
  navy: "1E3A5F",
  teal: "0D9488",
  tealDark: "0F766E",
  orange: "EA580C",
  gold: "D97706",
  cream: "FFFBF5",
  warmGray: "78716C",
  lightTeal: "F0FDFA",
  white: "FFFFFF",
  muted: "E7E5E4",
}

export async function fetchPowerPointLogoAsDataUrl(
  basePath = POWERPOINT_LOGO_PATH
): Promise<string | undefined> {
  if (typeof fetch === "undefined") return undefined
  try {
    const url =
      typeof window !== "undefined" && basePath.startsWith("/")
        ? `${window.location.origin}${basePath}`
        : basePath
    const response = await fetch(url)
    if (!response.ok) return undefined
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
    const mime = blob.type || "image/png"
    return `${mime};base64,${btoa(binary)}`
  } catch {
    return undefined
  }
}

/** PptxGenJS bullet config — do not use `type: "ul"` (it suppresses bullet rendering). */
const BULLET_ITEM_OPTIONS = {
  bullet: {
    characterCode: "2022",
    indent: 28,
  },
  paraSpaceAfter: 10,
} as const

function stripLeadingBulletMarker(text: string): string {
  return text.replace(/^[\s•\-\u2013\u2014*●◦▪▫]+/u, "").trim()
}

function addBulletList(
  slide: PptxSlideLike,
  bullets: string[],
  box: { x: number; y: number; w: number; h: number; fontSize: number }
) {
  const items = bullets
    .map((raw) => stripLeadingBulletMarker(raw.trim()))
    .filter(Boolean)
    .map((text, index, list) => ({
      text,
      options: {
        ...BULLET_ITEM_OPTIONS,
        breakLine: index < list.length - 1,
      },
    }))

  if (items.length === 0) return

  slide.addText(items, {
    ...box,
    color: COLORS.navy,
    valign: "top",
    margin: 0.12,
    lineSpacingMultiple: 1.2,
    fit: "shrink",
  })
}

function addSlideTitle(slide: PptxSlideLike, title: string) {
  slide.addText(title, {
    x: 0.75,
    y: HEADER_BOTTOM + 0.08,
    w: 11.85,
    h: 0.58,
    fontSize: 24,
    bold: true,
    color: COLORS.navy,
    margin: 0,
    breakLine: false,
    fit: "shrink",
  })
}

function addCoverLogo(slide: PptxSlideLike, context: PowerPointLayoutContext) {
  if (!context.logoData || !slide.addImage) return
  slide.addImage({
    data: context.logoData,
    x: SLIDE_W / 2 - 0.55,
    y: 0.95,
    w: 1.1,
    h: 1.1,
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
    fill: { color: COLORS.cream },
    line: { color: COLORS.muted },
  })
  slide.addText(data.image.alt || data.image.caption || "Image unavailable", {
    ...options,
    fontSize: 14,
    color: COLORS.warmGray,
    align: "center",
    valign: "mid",
    margin: 0.2,
    fit: "shrink",
  })
}

export const powerPointLayouts: PowerPointLayouts = {
  cover: (slide: PptxSlideLike, data: PresentationCoverSlide, context: PowerPointLayoutContext) => {
    const title = context.deckTitle || data.title
    addCoverLogo(slide, context)
    slide.addText(title, {
      x: 0.85,
      y: 2.35,
      w: 11.6,
      h: 1.05,
      fontSize: 34,
      bold: true,
      color: COLORS.navy,
      align: "center",
      margin: 0,
      fit: "shrink",
    })
    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 1.4,
        y: 3.55,
        w: 10.5,
        h: 0.55,
        fontSize: 17,
        color: COLORS.warmGray,
        align: "center",
        margin: 0,
        fit: "shrink",
      })
    }
    slide.addShape?.("rect", {
      x: 4.9,
      y: 4.35,
      w: 3.5,
      h: 0.06,
      fill: { color: COLORS.orange },
      line: { color: COLORS.orange },
    })
  },
  bullets: (slide: PptxSlideLike, data: PresentationBulletsSlide) => {
    addSlideTitle(slide, data.title)
    addBulletList(slide, data.bullets, {
      x: 0.85,
      y: HEADER_BOTTOM + 0.78,
      w: 11.6,
      h: FOOTER_TOP - HEADER_BOTTOM - 0.95,
      fontSize: 17,
    })
  },
  "image-title": (
    slide: PptxSlideLike,
    data: PresentationImageTitleSlide,
    context: PowerPointLayoutContext
  ) => {
    addSlideTitle(slide, data.title)
    const imageTop = HEADER_BOTTOM + 0.72
    const imageHeight = FOOTER_TOP - imageTop - 0.45
    addImageOrFallback(slide, data, context, {
      x: 1.1,
      y: imageTop,
      w: 11.1,
      h: imageHeight,
    })
    if (data.image.caption) {
      slide.addText(data.image.caption, {
        x: 1.1,
        y: FOOTER_TOP - 0.38,
        w: 11.1,
        h: 0.3,
        fontSize: 9,
        color: COLORS.warmGray,
        align: "center",
        fit: "shrink",
      })
    }
  },
  "image-bullets": (
    slide: PptxSlideLike,
    data: PresentationImageBulletsSlide,
    context: PowerPointLayoutContext
  ) => {
    addSlideTitle(slide, data.title)
    const bodyTop = HEADER_BOTTOM + 0.72
    const bodyHeight = FOOTER_TOP - bodyTop - 0.35
    addImageOrFallback(slide, data, context, {
      x: 0.75,
      y: bodyTop,
      w: 5.45,
      h: bodyHeight,
    })
    addBulletList(slide, data.bullets, {
      x: 6.55,
      y: bodyTop,
      w: 5.9,
      h: bodyHeight,
      fontSize: 15,
    })
    if (data.image.caption) {
      slide.addText(data.image.caption, {
        x: 0.75,
        y: FOOTER_TOP - 0.38,
        w: 5.45,
        h: 0.3,
        fontSize: 8,
        color: COLORS.warmGray,
        align: "center",
        fit: "shrink",
      })
    }
  },
}

interface PowerPointBranding {
  deckTitle: string
  brandName: string
  logoData?: string
}

function topAccentObjects(): object[] {
  return [
    {
      rect: {
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: 0.07,
        fill: { color: COLORS.teal },
        line: { color: COLORS.teal },
      },
    },
    {
      rect: {
        x: 0,
        y: 0.07,
        w: SLIDE_W * 0.42,
        h: 0.04,
        fill: { color: COLORS.orange },
        line: { color: COLORS.orange },
      },
    },
    {
      rect: {
        x: SLIDE_W * 0.42,
        y: 0.07,
        w: SLIDE_W * 0.58,
        h: 0.04,
        fill: { color: COLORS.gold },
        line: { color: COLORS.gold },
      },
    },
  ]
}

function footerObjects(brandName: string): object[] {
  return [
    {
      line: {
        x: 0.55,
        y: FOOTER_TOP - 0.08,
        w: 12.2,
        h: 0,
        line: { color: COLORS.muted, width: 1 },
      },
    },
    {
      text: {
        text: brandName,
        options: {
          x: 0.55,
          y: FOOTER_TOP,
          w: 3.2,
          h: 0.32,
          fontSize: 9,
          color: COLORS.tealDark,
          bold: true,
          margin: 0,
        },
      },
    },
  ]
}

function headerContentObjects(branding: PowerPointBranding): object[] {
  const objects: object[] = [
    ...topAccentObjects(),
    {
      rect: {
        x: 0,
        y: 0.11,
        w: SLIDE_W,
        h: HEADER_BOTTOM - 0.11,
        fill: { color: COLORS.lightTeal },
        line: { color: COLORS.lightTeal },
      },
    },
    {
      line: {
        x: 0.55,
        y: HEADER_BOTTOM - 0.02,
        w: 12.2,
        h: 0,
        line: { color: COLORS.teal, width: 1.25 },
      },
    },
  ]

  if (branding.logoData) {
    objects.push({
      image: {
        data: branding.logoData,
        x: 0.48,
        y: 0.2,
        w: 0.52,
        h: 0.52,
      },
    })
  }

  objects.push({
    text: {
      text: branding.deckTitle,
      options: {
        x: 1.12,
        y: 0.24,
        w: 11.5,
        h: 0.5,
        fontSize: 13,
        bold: true,
        color: COLORS.navy,
        margin: 0,
        fit: "shrink",
      },
    },
  })

  return objects
}

export function definePowerPointMasters(pres: PptxPresentationLike, branding: PowerPointBranding) {
  pres.layout = "LAYOUT_WIDE"
  pres.author = branding.brandName
  pres.company = branding.brandName
  pres.theme = {
    headFontFace: "Calibri Light",
    bodyFontFace: "Calibri",
  }

  pres.defineSlideMaster?.({
    title: "COVER",
    background: { color: COLORS.cream },
    objects: [...topAccentObjects(), ...footerObjects(branding.brandName)],
  })

  pres.defineSlideMaster?.({
    title: "CONTENT",
    background: { color: COLORS.white },
    objects: [
      ...headerContentObjects(branding),
      ...footerObjects(branding.brandName),
    ],
    slideNumber: {
      x: 11.85,
      y: FOOTER_TOP,
      w: 1.0,
      h: 0.32,
      fontSize: 9,
      color: COLORS.warmGray,
      align: "right",
    },
  })
}

/** @deprecated Use definePowerPointMasters */
export function definePowerPointMaster(pres: PptxPresentationLike) {
  definePowerPointMasters(pres, {
    deckTitle: "Presentation",
    brandName: POWERPOINT_BRAND_NAME,
  })
}

export function buildPowerPointDeck(
  doc: PresentationStructure,
  options: PowerPointDeckBuildOptions = {}
): PptxPresentationLike {
  const pres: PptxPresentationLike =
    options.createPresentation?.() ?? (new pptxgen() as unknown as PptxPresentationLike)

  const deckTitle = options.deckTitle?.trim() || doc.title
  const brandName = options.brandName?.trim() || POWERPOINT_BRAND_NAME

  pres.title = deckTitle
  pres.subject = doc.subtitle ?? "Generated from selected pinboard items"
  definePowerPointMasters(pres, {
    deckTitle,
    brandName,
    logoData: options.logoData,
  })

  const context: PowerPointLayoutContext = {
    images: options.images ?? {},
    deckTitle,
    brandName,
    logoData: options.logoData,
  }

  for (const slideData of doc.slides) {
    switch (slideData.type) {
      case "cover":
        powerPointLayouts.cover(
          pres.addSlide({ masterName: "COVER" }),
          slideData,
          context
        )
        break
      case "bullets":
        powerPointLayouts.bullets(
          pres.addSlide({ masterName: "CONTENT" }),
          slideData,
          context
        )
        break
      case "image-title":
        powerPointLayouts["image-title"](
          pres.addSlide({ masterName: "CONTENT" }),
          slideData,
          context
        )
        break
      case "image-bullets":
        powerPointLayouts["image-bullets"](
          pres.addSlide({ masterName: "CONTENT" }),
          slideData,
          context
        )
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
