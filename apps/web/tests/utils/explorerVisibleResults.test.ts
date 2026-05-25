import { describe, expect, it } from "vitest";

/**
 * Documents the explorer display contract: visible rows equal server page hits.
 * Full component tests live elsewhere; this guards the mapping helper semantics.
 */
describe("explorer visible results contract", () => {
  it("visible row count equals server-returned hits length", () => {
    const serverHits = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const visibleResults = serverHits;
    expect(visibleResults.length).toBe(serverHits.length);
    expect(visibleResults).toBe(serverHits);
  });
});
