import { describe, expect, it } from "vitest";
import {
  deriveSearchFacetParams,
  facetConstraintSignature,
  stripUnsupportedExplorerFilters,
} from "../../app/utils/explorerFacetFilters";

describe("explorerFacetFilters", () => {
  it("maps active adaptation_approaches to search facet params", () => {
    const params = deriveSearchFacetParams({
      adaptation_approaches: { Green: true, Grey: false },
    });
    expect(params.adaptation_approaches).toEqual(["Green"]);
    expect(params.keywords).toBeUndefined();
  });

  it("strips unsupported keys from effective filters", () => {
    const stripped = stripUnsupportedExplorerFilters({
      sector: { Agriculture: true },
      time: "last10",
      phases: { planning: true },
      scales: { local: true },
      keywords: ["broad"],
    });
    expect(stripped).toEqual({ sector: { Agriculture: true } });
    expect(stripped.time).toBeUndefined();
    expect(stripped.phases).toBeUndefined();
    expect(stripped.scales).toBeUndefined();
    expect(stripped.keywords).toBeUndefined();
  });

  it("omits adaptation_approaches when inactive or empty", () => {
    const params = deriveSearchFacetParams({
      sector: { Agriculture: true },
      adaptation_approaches: {},
    });
    expect(params.sectors).toEqual(["Agriculture"]);
    expect(params.adaptation_approaches).toEqual([]);
  });

  it("facetConstraintSignature ignores unsupported keys", () => {
    const withLegacy = facetConstraintSignature({
      sector: { Agriculture: true },
      time: "last10",
    });
    const withoutLegacy = facetConstraintSignature({
      sector: { Agriculture: true },
    });
    expect(withLegacy).toBe(withoutLegacy);
  });
});
