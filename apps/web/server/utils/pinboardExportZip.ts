import JSZip from "jszip"
import type { HumanPinRow } from "~/types/pins"

export const PINBOARD_EXPORT_FORMAT_VERSION = "1"

const IMAGE_FETCH_TIMEOUT_MS = 15_000
const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const IMAGE_CONCURRENCY = 4

export interface PinboardExportManifest {
  format_version: string
  exported_at: string
  project_id: string
  pinboard_id: string
  pin_count: number
  app: string
}

function safeArticleFilename(documentUid: string): string {
  return documentUid.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 200) || "unknown"
}

function extFromContentType(ct: string | null): string {
  if (!ct) return "bin"
  if (ct.includes("jpeg")) return "jpg"
  if (ct.includes("png")) return "png"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  if (ct.includes("svg")) return "svg"
  return "bin"
}

async function fetchImageBytes(url: string): Promise<{ bytes: Uint8Array; ext: string } | null> {
  if (!/^https?:\/\//i.test(url)) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "image/*,*/*" },
    })
    if (!res.ok) return null
    const lenHeader = res.headers.get("content-length")
    if (lenHeader) {
      const n = Number(lenHeader)
      if (Number.isFinite(n) && n > IMAGE_MAX_BYTES) return null
    }
    const buf = new Uint8Array(await res.arrayBuffer())
    if (buf.byteLength > IMAGE_MAX_BYTES) return null
    const ext = extFromContentType(res.headers.get("content-type"))
    return { bytes: buf, ext }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function runPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let idx = 0

  async function runOne(): Promise<void> {
    for (;;) {
      const i = idx++
      if (i >= items.length) return
      results[i] = await worker(items[i]!)
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runOne())
  await Promise.all(runners)
  return results
}

function pinMarkdown(
  pin: HumanPinRow,
  imageRelPath: string | null,
  imageFailed: boolean
): string {
  const lines: string[] = []
  lines.push(`# ${pin.source_title_snapshot?.trim() || "(no title)"}`)
  lines.push("")
  lines.push(`- **pin_id:** \`${pin.id}\``)
  lines.push(`- **body_kind:** \`${pin.body_kind}\``)
  lines.push(`- **sort_order:** ${pin.sort_order}`)
  if (pin.source_document_uid) {
    lines.push(`- **source_document_uid:** \`${pin.source_document_uid}\``)
  }
  lines.push("")
  if (pin.user_note?.trim()) {
    lines.push("## User note")
    lines.push("")
    lines.push(pin.user_note.trim())
    lines.push("")
  }
  const data = pin.body?.data
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const d = data as Record<string, unknown>
    if (typeof d.markdown === "string" && d.markdown.trim()) {
      lines.push("## Text / markdown")
      lines.push("")
      lines.push(d.markdown.trim())
      lines.push("")
    }
    if (typeof d.src === "string" && d.src) {
      lines.push("## Image")
      lines.push("")
      if (imageRelPath) {
        lines.push(`Embedded file: \`${imageRelPath}\``)
      } else if (imageFailed) {
        lines.push(`Image could not be downloaded. Original URL: ${d.src}`)
      } else {
        lines.push(`Image URL: ${d.src}`)
      }
      lines.push("")
    }
  }
  lines.push("---")
  lines.push("")
  lines.push(`Raw JSON for this pin is in \`pins/${String(pin.sort_order).padStart(4, "0")}-${pin.id}.json\`.`)
  return lines.join("\n")
}

export interface BuildPinboardExportZipInput {
  projectId: string
  pinboardId: string
  pins: HumanPinRow[]
  fetchArticleJson: (documentUid: string) => Promise<Record<string, unknown> | null>
}

export async function buildPinboardExportZipBuffer(
  input: BuildPinboardExportZipInput
): Promise<Uint8Array> {
  const zip = new JSZip()
  const manifest: PinboardExportManifest = {
    format_version: PINBOARD_EXPORT_FORMAT_VERSION,
    exported_at: new Date().toISOString(),
    project_id: input.projectId,
    pinboard_id: input.pinboardId,
    pin_count: input.pins.length,
    app: "farclimate-web",
  }
  zip.file("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`)

  const seenArticleUids = new Set<string>()
  for (const pin of input.pins) {
    const uid = pin.source_document_uid?.trim()
    if (!uid || seenArticleUids.has(uid)) continue
    seenArticleUids.add(uid)
    const article = await input.fetchArticleJson(uid)
    const fname = `articles/${safeArticleFilename(uid)}.json`
    if (article) {
      zip.file(fname, `${JSON.stringify(article, null, 2)}\n`)
    } else {
      zip.file(
        fname.replace(/\.json$/, ".missing.txt"),
        `Article not found or could not be loaded for document_uid=${uid}\n`
      )
    }
  }

  const imagePins = input.pins.filter(
    (p) =>
      p.body_kind === "image" &&
      typeof p.body?.data === "object" &&
      p.body?.data &&
      typeof (p.body.data as Record<string, unknown>).src === "string"
  )

  const fetched = await runPool(imagePins, IMAGE_CONCURRENCY, async (pin) => {
    const src = String((pin.body!.data as Record<string, unknown>).src)
    const got = await fetchImageBytes(src)
    return { pin, got }
  })

  const pinIdToMediaPath = new Map<string, string>()
  const pinIdToImageFailed = new Map<string, boolean>()

  for (const { pin, got } of fetched) {
    if (got) {
      const rel = `media/${pin.id}.${got.ext}`
      zip.file(rel, got.bytes)
      pinIdToMediaPath.set(pin.id, rel)
    } else {
      pinIdToImageFailed.set(pin.id, true)
    }
  }

  for (const pin of input.pins) {
    const prefix = `${String(pin.sort_order).padStart(4, "0")}-${pin.id}`
    const mediaPath = pinIdToMediaPath.get(pin.id) ?? null
    const imageFailed = pinIdToImageFailed.get(pin.id) === true && !mediaPath
    zip.file(`pins/${prefix}.md`, pinMarkdown(pin, mediaPath, imageFailed))
    zip.file(
      `pins/${prefix}.json`,
      `${JSON.stringify(
        {
          id: pin.id,
          pinboard_id: pin.pinboard_id,
          source_document_uid: pin.source_document_uid,
          source_title_snapshot: pin.source_title_snapshot,
          body_kind: pin.body_kind,
          body: pin.body,
          user_note: pin.user_note,
          sort_order: pin.sort_order,
          created_at: pin.created_at,
          updated_at: pin.updated_at,
        },
        null,
        2
      )}\n`
    )
  }

  const out = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })
  return out
}
