import { describe, expect, it } from "vitest";
import { humanPinToBoardItem } from "../../app/composables/usePinsSupabase";
import type { HumanPinRow } from "../../app/types/pins";

describe("humanPinToBoardItem markmap", () => {
  it("maps markmap pins to result type with markdown in data", () => {
    const row: HumanPinRow = {
      id: "p1",
      pinboard_id: "pb1",
      source_document_uid: "doc-1",
      source_title_snapshot: "Article — Mind map",
      body_kind: "markmap",
      body: { v: 1, data: { markdown: "## Root\n\n### A", yaml: "---\ntitle: x\n---\n" } },
      user_note: null,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const item = humanPinToBoardItem(row);
    expect(item.type).toBe("result");
    expect(item.body_kind).toBe("markmap");
    expect(item.data.markdown).toBe("## Root\n\n### A");
    expect(item.data.yaml).toBe("---\ntitle: x\n---\n");
  });
});
