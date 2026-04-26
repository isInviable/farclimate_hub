import type { SavedSearchFilters } from "~/types/savedSearches";

const STORAGE_KEY = "farclimate:pending-saved-search-apply-v1";

export type PendingSavedSearchApplyPayload = {
  projectId: string;
  filters: SavedSearchFilters;
};

export function setPendingSavedSearchApply(
  payload: PendingSavedSearchApplyPayload
): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/**
 * If a pending apply exists for `projectId`, removes it from storage and returns filters.
 * If project does not match, leaves storage unchanged.
 */
export function tryConsumePendingSavedSearchApply(
  projectId: string | null
): SavedSearchFilters | null {
  if (!projectId || typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  let parsed: PendingSavedSearchApplyPayload;
  try {
    parsed = JSON.parse(raw) as PendingSavedSearchApplyPayload;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
  if (!parsed?.projectId || parsed.projectId !== projectId) return null;
  if (!parsed.filters) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
  sessionStorage.removeItem(STORAGE_KEY);
  return parsed.filters;
}
