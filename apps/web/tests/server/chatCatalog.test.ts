import { describe, expect, it } from "vitest";
import {
  filterCitationsToCatalog,
  normalizeCatalog,
  parseChatMode,
} from "../../server/utils/chatCatalog";

describe("server chatCatalog", () => {
  it("parseChatMode returns corpus only for corpus string", () => {
    expect(parseChatMode("corpus")).toBe("corpus");
    expect(parseChatMode("single")).toBe("single");
    expect(parseChatMode(undefined)).toBe("single");
  });

  it("normalizeCatalog trims and fills documentUid", () => {
    const catalog = normalizeCatalog([
      { articleId: " uid-1 ", documentUid: "", title: "  Title  " },
    ]);
    expect(catalog).toEqual([
      {
        articleId: "uid-1",
        documentUid: "uid-1",
        title: "Title",
      },
    ]);
  });

  it("filterCitationsToCatalog drops unknown ids and dedupes", () => {
    const catalog = normalizeCatalog([
      { articleId: "a1", documentUid: "a1", title: "A" },
      { articleId: "a2", documentUid: "a2", title: "B" },
    ]);
    const out = filterCitationsToCatalog(
      ["a1", "unknown", "a1", "a2"],
      catalog,
    );
    expect(out).toHaveLength(2);
    expect(out.map((c) => c.articleId)).toEqual(["a1", "a2"]);
  });

  it("returns empty citations when catalog is empty", () => {
    expect(filterCitationsToCatalog(["a1"], [])).toEqual([]);
  });
});
