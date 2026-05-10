/** Locale codes that match `knowledge.summary_multilang.lang` / RPC `filter_lang`. */
const KNOWLEDGE_API_LANGS = new Set(["en", "es", "it"]);

/**
 * Map i18n locale (e.g. `it`, `it-IT`) to the `lang` query/body param for knowledge RPCs.
 * Unknown locales fall back to English.
 */
export function knowledgeApiLang(localeCode: string): string {
  const base = (localeCode || "en").split("-")[0]!.toLowerCase();
  return KNOWLEDGE_API_LANGS.has(base) ? base : "en";
}
