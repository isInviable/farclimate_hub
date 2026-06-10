import type { EntityRow } from "~/types/cordis";

export function toRiskOrThemeList(value: string | string[] | null | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split("|").map((s) => s.trim()).filter(Boolean);
}

export function intersectSets(setA: Set<string>, setB: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const item of setA) {
    if (setB.has(item)) result.add(item);
  }
  return result;
}

export function unionFromMap(keys: Set<string>, map: Map<string, Set<string>>): Set<string> {
  const result = new Set<string>();
  for (const key of keys) {
    const values = map.get(key);
    if (!values) continue;
    for (const value of values) result.add(value);
  }
  return result;
}

export function normalizeEntityNutsId(
  entity: Pick<EntityRow, "related_nuts_code_nuts_code" | "related_region_nuts_code">,
  validNuts3Ids: Set<string>
): string | null {
  const primary = entity.related_nuts_code_nuts_code?.trim();
  if (primary && validNuts3Ids.has(primary)) return primary;

  const fallback = entity.related_region_nuts_code?.trim();
  if (fallback && validNuts3Ids.has(fallback)) return fallback;

  return null;
}
