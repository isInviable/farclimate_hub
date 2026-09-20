import { describe, expect, it } from "vitest";
import { cosine, runDeterministicUmap, UMAP } from "../../app/utils/umapLayout";

describe("umapLayout CJS interop", () => {
  it("exposes the UMAP constructor from the CommonJS package", () => {
    expect(typeof UMAP).toBe("function");
  });

  it("computes cosine distance without importing umap-js named exports", () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(0);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(1);
    expect(cosine([0, 0], [0, 0])).toBe(0);
  });

  it("fits a tiny deterministic embedding", () => {
    const embedding = runDeterministicUmap(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 0],
      ],
      { nPoints: 4, seed: 42, nNeighbors: 2 }
    );

    expect(embedding).toHaveLength(4);
    for (const point of embedding) {
      expect(Number.isFinite(point[0])).toBe(true);
      expect(Number.isFinite(point[1])).toBe(true);
    }
  });
});
