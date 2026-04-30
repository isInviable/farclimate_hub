import JSZip from "jszip"
import { describe, expect, it } from "vitest"
import type { HumanPinRow } from "../../app/types/pins"
import {
  buildPinboardExportZipBuffer,
  PINBOARD_EXPORT_FORMAT_VERSION,
} from "../../server/utils/pinboardExportZip"

function pin(partial: Partial<HumanPinRow> & Pick<HumanPinRow, "id">): HumanPinRow {
  return {
    pinboard_id: partial.pinboard_id ?? "00000000-0000-4000-8000-0000000000bb",
    source_document_uid: partial.source_document_uid ?? null,
    source_title_snapshot: partial.source_title_snapshot ?? "Title",
    body_kind: partial.body_kind ?? "text_segment",
    body: partial.body ?? { v: 1, data: {} },
    user_note: partial.user_note ?? null,
    sort_order: partial.sort_order ?? 0,
    created_at: partial.created_at ?? "2026-01-01T00:00:00.000Z",
    updated_at: partial.updated_at ?? "2026-01-01T00:00:00.000Z",
    ...partial,
  }
}

describe("buildPinboardExportZipBuffer", () => {
  it("includes manifest for empty pinboard", async () => {
    const buf = await buildPinboardExportZipBuffer({
      projectId: "proj-1",
      pinboardId: "board-1",
      pins: [],
      fetchArticleJson: async () => null,
    })
    const z = await JSZip.loadAsync(buf)
    const raw = await z.file("manifest.json")?.async("string")
    expect(raw).toBeTruthy()
    const manifest = JSON.parse(raw!) as { format_version: string; pin_count: number }
    expect(manifest.format_version).toBe(PINBOARD_EXPORT_FORMAT_VERSION)
    expect(manifest.pin_count).toBe(0)
  })

  it("writes pins and deduped article json", async () => {
    const pins: HumanPinRow[] = [
      pin({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        source_document_uid: "doc-uid-1",
        sort_order: 0,
        body: { v: 1, data: { markdown: "Hello" } },
      }),
      pin({
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        source_document_uid: "doc-uid-1",
        sort_order: 1,
        body: { v: 1, data: {} },
      }),
    ]
    let fetchCount = 0
    const buf = await buildPinboardExportZipBuffer({
      projectId: "proj-1",
      pinboardId: "board-1",
      pins,
      fetchArticleJson: async (uid) => {
        fetchCount += 1
        return uid === "doc-uid-1" ? { title: "Paper", document_uid: uid } : null
      },
    })
    expect(fetchCount).toBe(1)

    const z = await JSZip.loadAsync(buf)
    const names = Object.keys(z.files).filter((k) => !z.files[k]!.dir).sort()
    expect(names.some((n) => n.startsWith("articles/") && n.endsWith(".json"))).toBe(true)
    expect(names).toContain("pins/0000-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.md")
    expect(names).toContain("pins/0000-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.json")
    expect(names).toContain("pins/0001-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.json")
  })
})
