import type { SearchFacetParams } from "@/types/search";

/** Filter keys that must not appear in the explorer UI or affect search requests. */
export const UNSUPPORTED_EXPLORER_FILTER_KEYS = [
  "time",
  "phases",
  "scales",
  "keywords",
] as const;

export type UnsupportedExplorerFilterKey =
  (typeof UNSUPPORTED_EXPLORER_FILTER_KEYS)[number];

export function activeKeysFromBooleanMap(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, selected]) => Boolean(selected))
    .map(([key]) => key)
    .sort();
}

export function stringsFromArrayOrBooleanMap(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
  }
  return activeKeysFromBooleanMap(value);
}

export function stripUnsupportedExplorerFilters(
  filters: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([key]) =>
        !UNSUPPORTED_EXPLORER_FILTER_KEYS.includes(
          key as UnsupportedExplorerFilterKey
        )
    )
  );
}

/** Map active explorer filter state to server facet params (keywords intentionally omitted). */
export function deriveSearchFacetParams(
  filters: Record<string, unknown>
): SearchFacetParams {
  const sanitized = stripUnsupportedExplorerFilters(filters);
  return {
    sectors: stringsFromArrayOrBooleanMap(sanitized.sector),
    climate_impacts: stringsFromArrayOrBooleanMap(sanitized.hazards),
    adaptation_approaches: stringsFromArrayOrBooleanMap(
      sanitized.adaptation_approaches
    ),
    biogeographical_regions: stringsFromArrayOrBooleanMap(
      sanitized.biogeographical_regions
    ),
  };
}

export function facetConstraintSignature(
  filters: Record<string, unknown>
): string {
  const params = deriveSearchFacetParams(filters);
  return JSON.stringify({
    sectors: [...(params.sectors ?? [])].sort(),
    climate_impacts: [...(params.climate_impacts ?? [])].sort(),
    adaptation_approaches: [...(params.adaptation_approaches ?? [])].sort(),
    biogeographical_regions: [...(params.biogeographical_regions ?? [])].sort(),
  });
}

export function facetConstraintsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  return facetConstraintSignature(a) === facetConstraintSignature(b);
}

export function hasActiveExplorerFacetConstraints(
  filters: Record<string, unknown>
): boolean {
  const params = deriveSearchFacetParams(filters);
  return [
    params.sectors,
    params.climate_impacts,
    params.adaptation_approaches,
    params.biogeographical_regions,
  ].some((arr) => (arr?.length ?? 0) > 0);
}
