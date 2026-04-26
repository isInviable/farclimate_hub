import { describe, expect, it } from "vitest";
import { humanPinToBoardItem } from "../../app/composables/usePinsSupabase";
import type { HumanPinRow } from "../../app/types/pins";

describe("humanPinToBoardItem document", () => {
  it("maps document pins to board type result", () => {
    const row: HumanPinRow = {
      id: "p-doc",
      pinboard_id: "pb1",
      source_document_uid: "doc-uid-1",
      source_title_snapshot: "Full catalog document",
      body_kind: "document",
      body: { v: 1, data: { pinned_as: "full_document" } },
      user_note: "Keep",
      sort_order: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const item = humanPinToBoardItem(row);
    expect(item.type).toBe("result");
    expect(item.body_kind).toBe("document");
    expect(item.data.pinned_as).toBe("full_document");
    expect(item.source_document_uid).toBe("doc-uid-1");
  });
});
