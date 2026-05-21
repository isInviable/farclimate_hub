import { describe, expect, it } from "vitest";
import {
  buildCatalogFromDocument,
  buildCatalogFromHits,
  inferChatMode,
} from "../../app/utils/chatCatalog";

describe("chatCatalog", () => {
  it("uses document_uid as articleId when present on hit", () => {
    const catalog = buildCatalogFromHits([
      {
        id: "internal-uuid-1",
        document_uid: "stable-uid-abc",
        document: { title: "Coastal plan", document_uid: "stable-uid-abc" },
      },
    ]);
    expect(catalog).toHaveLength(1);
    expect(catalog[0]?.articleId).toBe("stable-uid-abc");
    expect(catalog[0]?.documentUid).toBe("stable-uid-abc");
    expect(catalog[0]?.title).toBe("Coastal plan");
  });

  it("falls back to hit id when document_uid is missing", () => {
    const catalog = buildCatalogFromHits([
      {
        id: "only-uuid",
        document: { title: "Fallback title" },
      },
    ]);
    expect(catalog[0]?.articleId).toBe("only-uuid");
  });

  it("deduplicates catalog entries by articleId", () => {
    const catalog = buildCatalogFromHits([
      {
        id: "a",
        document_uid: "uid-1",
        document: { title: "One", document_uid: "uid-1" },
      },
      {
        id: "b",
        document_uid: "uid-1",
        document: { title: "One again", document_uid: "uid-1" },
      },
    ]);
    expect(catalog).toHaveLength(1);
  });

  it("infers single mode from document prop", () => {
    expect(inferChatMode({ id: "x", title: "Doc" }, [])).toBe("single");
    expect(inferChatMode(null, [{ id: "h", document: {} }])).toBe("corpus");
  });

  it("builds single-entry catalog from document", () => {
    const catalog = buildCatalogFromDocument({
      id: "row-id",
      document_uid: "uid-doc",
      title: "My study",
    });
    expect(catalog).toEqual([
      {
        articleId: "uid-doc",
        documentUid: "uid-doc",
        title: "My study",
      },
    ]);
  });
});
