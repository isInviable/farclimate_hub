export type FacetCategory =
  | "climate_impacts"
  | "adaptation_approaches"
  | "sectors"
  | "biogeographical_regions"
  | "keywords";

export type FacetLabelMap = Partial<Record<FacetCategory, Record<string, string>>>;

/** Map list-match badge kind to facet category for label lookup. */
export const LIST_MATCH_BADGE_KIND_TO_CATEGORY: Partial<
  Record<"sector" | "hazard" | "adaptation" | "bioregion", FacetCategory>
> = {
  sector: "sectors",
  hazard: "climate_impacts",
  adaptation: "adaptation_approaches",
  bioregion: "biogeographical_regions",
};

/**
 * Resolve a locale display label for a canonical English facet value.
 * Falls back to the trimmed English value when no translation exists.
 */
export function facetLabelFromMap(
  category: FacetCategory,
  englishValue: string,
  map: FacetLabelMap | Record<string, Record<string, string>> | undefined,
): string {
  const trimmed = englishValue.trim();
  if (!trimmed) return trimmed;
  const categoryMap = map?.[category];
  if (categoryMap && typeof categoryMap === "object") {
    const translated = categoryMap[trimmed];
    if (typeof translated === "string" && translated.length > 0) {
      return translated;
    }
  }
  return trimmed;
}
