import { describe, expect, it } from "vitest";
import {
  fullPaperDocumentPinsSorted,
  groupFragmentPinsByDocumentUid,
} from "../../app/utils/pinBoardFullPaperGroups";
import type { HumanPinRow } from "../../app/types/pins";

function pin(
  o: Partial<HumanPinRow> & Pick<HumanPinRow, "id" | "body_kind">,
): HumanPinRow {
  return {
    id: o.id,
    body_kind: o.body_kind,
    pinboard_id: o.pinboard_id ?? "pb",
    source_document_uid: o.source_document_uid ?? null,
    source_title_snapshot: o.source_title_snapshot ?? null,
    user_note: o.user_note ?? null,
    sort_order: o.sort_order ?? 0,
    created_at: o.created_at ?? "2026-01-01T00:00:00Z",
    updated_at: o.updated_at ?? "2026-01-01T00:00:00Z",
    body: o.body ?? { v: 1, data: {} },
  };
}

describe("pinBoardFullPaperGroups", () => {
  it("fullPaperDocumentPinsSorted returns only document pins in stable order", () => {
    const rows = [
      pin({ id: "a", body_kind: "text_segment", sort_order: 0 }),
      pin({ id: "b", body_kind: "document", sort_order: 2 }),
      pin({ id: "c", body_kind: "document", sort_order: 1 }),
    ];
    const out = fullPaperDocumentPinsSorted(rows);
    expect(out.map((p) => p.id)).toEqual(["c", "b"]);
  });

  it("groupFragmentPinsByDocumentUid excludes document pins and null uids", () => {
    const rows = [
      pin({
        id: "d1",
        body_kind: "document",
        source_document_uid: "uid-1",
        sort_order: 0,
      }),
      pin({
        id: "f1",
        body_kind: "text_segment",
        source_document_uid: "uid-1",
        source_title_snapshot: "Paper A",
        sort_order: 1,
      }),
      pin({
        id: "f2",
        body_kind: "markmap",
        source_document_uid: null,
        sort_order: 2,
      }),
      pin({
        id: "f3",
        body_kind: "selected_text",
        source_document_uid: "uid-2",
        source_title_snapshot: "Paper B",
        sort_order: 0,
      }),
    ];
    const groups = groupFragmentPinsByDocumentUid(rows);
    expect(groups).toHaveLength(2);
    const g1 = groups.find((g) => g.source_document_uid === "uid-1");
    expect(g1?.pins.map((p) => p.id)).toEqual(["f1"]);
    const g2 = groups.find((g) => g.source_document_uid === "uid-2");
    expect(g2?.pins.map((p) => p.id)).toEqual(["f3"]);
  });

  it("collapses multiple fragment pins for the same uid into one group", () => {
    const rows = [
      pin({
        id: "x",
        body_kind: "text_segment",
        source_document_uid: "uid-x",
        source_title_snapshot: "Title",
        sort_order: 0,
      }),
      pin({
        id: "y",
        body_kind: "recipe_section",
        source_document_uid: "uid-x",
        sort_order: 1,
      }),
    ];
    const groups = groupFragmentPinsByDocumentUid(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.pins).toHaveLength(2);
    expect(groups[0]!.displayTitle).toBe("Title");
  });
});
