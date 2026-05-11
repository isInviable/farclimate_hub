/**
 * URL → explorer free-text search (passthrough).
 * Precedence: `query` → `type` → `sector` (then trim / sector=all → empty).
 */

export function firstQueryString(param: unknown): string | null {
  if (param == null) return null;
  const s = Array.isArray(param) ? param[0] : param;
  return typeof s === "string" && s.trim() ? s.trim() : null;
}

/** Raw `sector` param → text for hybrid search, or null if absent / reserved `all` (case-insensitive). */
export function searchTextFromSectorParam(raw: unknown): string | null {
  const s = firstQueryString(raw);
  if (!s) return null;
  if (s.toLowerCase() === "all") return null;
  return s;
}

export type ExplorerRouteSearchSource = "query" | "type" | "sector" | null;

export function resolveExplorerInitialSearchFromRoute(query: Record<string, unknown>): {
  text: string | null;
  source: ExplorerRouteSearchSource;
} {
  const fromQuery = firstQueryString(query.query);
  if (fromQuery) return { text: fromQuery, source: "query" };

  const fromType = firstQueryString(query.type);
  if (fromType) return { text: fromType, source: "type" };

  const fromSector = searchTextFromSectorParam(query.sector);
  if (fromSector) return { text: fromSector, source: "sector" };

  return { text: null, source: null };
}
