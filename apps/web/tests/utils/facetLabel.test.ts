import { describe, expect, it } from "vitest";
import {
  facetLabelFromMap,
  LIST_MATCH_BADGE_KIND_TO_CATEGORY,
} from "../../app/utils/facetLabel";
import {
  listMatchBadgesForDocument,
  resolveListMatchBadgeLabel,
} from "../../app/utils/listMatchBadges";

const sampleMap = {
  climate_impacts: {
    Droughts: "Sequías",
    Flooding: "Inundaciones",
  },
  sectors: {
    Forestry: "Silvicultura",
  },
  adaptation_approaches: {
    "Nature-based solutions": "Soluciones basadas en la naturaleza",
  },
  biogeographical_regions: {
    Atlantic: "Atlántico",
    "no-identificados": "No identificados",
  },
  keywords: {
    heatwave: "ola de calor",
  },
};

describe("facetLabelFromMap", () => {
  it("returns translated value when present", () => {
    expect(facetLabelFromMap("climate_impacts", "Droughts", sampleMap)).toBe(
      "Sequías",
    );
  });

  it("returns identity for English when map matches", () => {
    expect(
      facetLabelFromMap("sectors", "Forestry", {
        sectors: { Forestry: "Forestry" },
      }),
    ).toBe("Forestry");
  });

  it("falls back to English when translation missing", () => {
    expect(facetLabelFromMap("climate_impacts", "Storms", sampleMap)).toBe(
      "Storms",
    );
  });

  it("trims whitespace before lookup and fallback", () => {
    expect(facetLabelFromMap("climate_impacts", "  Droughts  ", sampleMap)).toBe(
      "Sequías",
    );
    expect(facetLabelFromMap("climate_impacts", "  Unknown  ", sampleMap)).toBe(
      "Unknown",
    );
  });
});

describe("resolveListMatchBadgeLabel", () => {
  const facetLabel = (category: keyof typeof sampleMap, value: string) =>
    facetLabelFromMap(category, value, sampleMap);

  it("maps hazard badges through climate_impacts", () => {
    const badges = listMatchBadgesForDocument(
      { climate_impacts: ["Droughts"] } as never,
      { hazards: { Droughts: true } },
    );
    expect(badges[0]?.kind).toBe("hazard");
    expect(resolveListMatchBadgeLabel(badges[0]!, facetLabel)).toBe("Sequías");
  });

  it("falls back to English for unknown badge values", () => {
    const badge = {
      kind: "hazard" as const,
      label: "Storms",
    };
    expect(resolveListMatchBadgeLabel(badge, facetLabel)).toBe("Storms");
  });

  it("maps badge kinds to facet categories", () => {
    expect(LIST_MATCH_BADGE_KIND_TO_CATEGORY.sector).toBe("sectors");
    expect(LIST_MATCH_BADGE_KIND_TO_CATEGORY.hazard).toBe("climate_impacts");
    expect(LIST_MATCH_BADGE_KIND_TO_CATEGORY.adaptation).toBe(
      "adaptation_approaches",
    );
    expect(LIST_MATCH_BADGE_KIND_TO_CATEGORY.bioregion).toBe(
      "biogeographical_regions",
    );
  });
});

describe("BarChartFilter count keys", () => {
  it("uses canonical English keys for count maps", () => {
    const items = [{ key: "Droughts", label: "Sequías" }];
    const counts = { Droughts: 6 };
    const countsGlobal = { Droughts: 14 };
    for (const item of items) {
      expect(counts[item.key]).toBe(6);
      expect(countsGlobal[item.key]).toBe(14);
      expect(counts[item.label as keyof typeof counts]).toBeUndefined();
    }
  });
});
