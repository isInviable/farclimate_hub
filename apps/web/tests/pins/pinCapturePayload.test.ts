import { describe, expect, it } from "vitest";
import { buildPinCapturePayload } from "../../app/utils/pinCapturePayload";

describe("buildPinCapturePayload", () => {
  it("builds explicit payloads with notes and valid article location", () => {
    const payload = buildPinCapturePayload({
      bodyKind: "selected_text",
      title: "Article — Selected text",
      data: { quote: "A useful passage", sourceView: "summary" },
      notes: "Important for the board",
      sourceDocumentUid: "doc-123",
      location: [41.39, 2.17],
    });

    expect(payload).toEqual({
      body_kind: "selected_text",
      body: {
        v: 1,
        data: {
          quote: "A useful passage",
          sourceView: "summary",
          location: [41.39, 2.17],
        },
      },
      source_document_uid: "doc-123",
      source_title_snapshot: "Article — Selected text",
      user_note: "Important for the board",
    });
  });

  it("normalizes blank notes and ignores invalid placeholder locations", () => {
    const payload = buildPinCapturePayload({
      bodyKind: "recipe_section",
      data: { sectionKey: "challenges", markdown: "Content" },
      notes: "   ",
      sourceDocumentUid: null,
      location: [0, 0],
    });

    expect(payload.user_note).toBeNull();
    expect(payload.source_document_uid).toBeNull();
    expect(payload.source_title_snapshot).toBeNull();
    expect(payload.body.data).toEqual({
      sectionKey: "challenges",
      markdown: "Content",
    });
  });

  it("builds markmap pin body with markdown and optional yaml", () => {
    const payload = buildPinCapturePayload({
      bodyKind: "markmap",
      title: "Case study — Mind map",
      data: {
        markdown: "# Root\n\n## Branch",
        yaml: "---\ntitle: t\n---\n",
      },
      notes: null,
      sourceDocumentUid: "doc-uid-1",
      location: null,
    });

    expect(payload.body_kind).toBe("markmap");
    expect(payload.body.data).toEqual({
      markdown: "# Root\n\n## Branch",
      yaml: "---\ntitle: t\n---\n",
    });
    expect(payload.source_document_uid).toBe("doc-uid-1");
    expect(payload.source_title_snapshot).toBe("Case study — Mind map");
  });

  it("builds full-document pin with stable body.data marker", () => {
    const payload = buildPinCapturePayload({
      bodyKind: "document",
      title: "Coastal adaptation plan",
      data: {},
      notes: "Read for the workshop",
      sourceDocumentUid: "uid-abc",
      location: null,
    });

    expect(payload.body_kind).toBe("document");
    expect(payload.body.data).toEqual({ pinned_as: "full_document" });
    expect(payload.source_document_uid).toBe("uid-abc");
    expect(payload.source_title_snapshot).toBe("Coastal adaptation plan");
    expect(payload.user_note).toBe("Read for the workshop");
  });
});
