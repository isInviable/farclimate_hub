import {
  facetLabelFromMap,
  type FacetCategory,
  type FacetLabelMap,
} from "~/utils/facetLabel";

export function useFacetLabel() {
  const { locale, getLocaleMessage, rt, tm } = useI18n();

  function facetLabel(category: FacetCategory, englishValue: string): string {
    const trimmed = englishValue.trim();
    if (!trimmed) return trimmed;

    // Prefer raw locale JSON (reliable for dynamic English keys with spaces).
    const root = getLocaleMessage(locale.value) as { facets?: FacetLabelMap };
    const fromRaw = facetLabelFromMap(category, trimmed, root.facets);
    if (fromRaw !== trimmed) return fromRaw;

    // Fallback: tm + rt for compiled message trees (vue-i18n v9+).
    const categoryMap = tm(`facets.${category}`) as Record<string, unknown> | string;
    if (categoryMap && typeof categoryMap === "object") {
      const message = categoryMap[trimmed];
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
      if (message != null) {
        const resolved = rt(message as string);
        if (typeof resolved === "string" && resolved.length > 0) {
          return resolved;
        }
      }
    }

    return trimmed;
  }

  return { facetLabel };
}
