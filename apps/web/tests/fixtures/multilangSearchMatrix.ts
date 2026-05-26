/**
 * Intent-aligned free-text queries for multilingual explorer search parity checks.
 * Each row is the same informational need in es / en / it (query language must match `lang`).
 */
export type MultilangSearchIntentId =
  | "forestry"
  | "agriculture"
  | "mediterranean_fires"
  | "crop_climate_adaptation";

export type KnowledgeLang = "en" | "es" | "it";

export interface MultilangSearchIntentRow {
  id: MultilangSearchIntentId;
  label: string;
  queries: Record<KnowledgeLang, string>;
}

export const MULTILANG_SEARCH_MATRIX: MultilangSearchIntentRow[] = [
  {
    id: "forestry",
    label: "Forestry / silviculture",
    queries: {
      es: "silvicultura",
      en: "forestry",
      it: "silvicoltura",
    },
  },
  {
    id: "agriculture",
    label: "Agriculture",
    queries: {
      es: "agricultura",
      en: "agriculture",
      it: "agricoltura",
    },
  },
  {
    id: "mediterranean_fires",
    label: "Mediterranean wildfires",
    queries: {
      es: "incendios mediterraneo",
      en: "mediterranean wildfires",
      it: "incendi mediterranei",
    },
  },
  {
    id: "crop_climate_adaptation",
    label: "Climate adaptation of crops",
    queries: {
      es: "adaptacion climatica de cultivos",
      en: "climate adaptation of crops",
      it: "adattamento climatico colture",
    },
  },
];

export const KNOWLEDGE_LANGS: KnowledgeLang[] = ["en", "es", "it"];
