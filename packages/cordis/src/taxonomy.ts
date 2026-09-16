export type TaxonomyItem = {
  id: number;
  name: string;
};

// Climate risks and main themes are the Mission Projects Catalogue legend.
// `name` must match the hosted aux_climate_risks / aux_themes rows and the
// `pdf_legend_name` column of data/project_climate_risks.csv and
// data/project_main_themes.csv. pdf-categories.ts fails the run on any
// mismatch, so a renamed or added legend entry forces a deliberate edit here.
export const RISKS: TaxonomyItem[] = [
  { id: 1, name: "Coastal erosion" },
  { id: 2, name: "Drought" },
  { id: 3, name: "Extreme heat" },
  { id: 4, name: "Flooding" },
  { id: 5, name: "Heavy precipitation" },
  { id: 6, name: "Landslides" },
  { id: 7, name: "Precipitation changes" },
  { id: 8, name: "Sea level rise" },
  { id: 9, name: "Severe winds" },
  { id: 10, name: "Storms" },
  { id: 11, name: "Surface air temperature increase" },
  { id: 12, name: "Tropical cyclones" },
  { id: 13, name: "Wildfires" },
];

export const THEMES: TaxonomyItem[] = [
  { id: 1, name: "Adaptation funding & finance" },
  { id: 2, name: "Behavioural change" },
  { id: 3, name: "Ecosystems and nature-based solutions" },
  { id: 4, name: "Governance" },
  { id: 5, name: "Health and wellbeing" },
  { id: 6, name: "Infrastructure" },
  { id: 7, name: "Knowledge and data on adaptation" },
  { id: 8, name: "Land use and food systems" },
  { id: 9, name: "Local economic systems" },
  { id: 10, name: "Mainstreaming adaptation" },
  { id: 11, name: "Stakeholder and citizen engagement" },
  { id: 12, name: "Transformative change" },
  { id: 13, name: "Water management" },
];

export const ENTITY_TYPES = [
  { name: "Public bodies", codes: ["PUB"] },
  { name: "Private for-profit entities", codes: ["PRC", "ENT"] },
  { name: "Higher or Secondary Education Establishments", codes: ["HES"] },
  { name: "Research Organisations", codes: ["REC"] },
  { name: "Other", codes: ["OTH"] },
];

// Entity type used when an organisation carries no organizationActivityType
// category, or one this map does not know. entities_cordis
// .organization_activity_type_id is NOT NULL on the hosted database.
export const FALLBACK_ENTITY_TYPE_NAME = "Other";

// `name` values match the hosted aux_product_categories rows, including the
// "peer rewied article" typo, because the Hub renders them and admins may have
// bookmarked them. Ids 7 and 8 were added by hand in the Supabase console.
export const PRODUCT_TYPES = [
  { id: 1, name: "article", codes: ["ARTICLE", "ARTICLES"] },
  { id: 2, name: "peer rewied article", codes: ["PEER_REVIEWED_ARTICLE", "PEER REVIEWED"] },
  {
    id: 3,
    name: "conference proceedings",
    codes: ["CONFERENCE_PROCEEDING", "CONFERENCE_PROCEEDINGS", "CONFERENCE PAPER"],
  },
  { id: 4, name: "report", codes: ["REPORT", "DOCUMENTS, REPORTS"] },
  { id: 5, name: "dataset", codes: ["DATASET"] },
  { id: 6, name: "platform", codes: ["PLATFORM"] },
  { id: 7, name: "database", codes: ["DATABASE"] },
  {
    id: 8,
    name: "other",
    codes: ["OTHER", "BOOK_CHAPTER", "THESIS_DISSERTATION", "MONOGRAPHIC_BOOK"],
  },
];

// products.product_category_id is NOT NULL on the hosted database, so every
// publication needs a category. Unknown CORDIS codes land here and are listed
// by `cordis:drift` so each one gets an explicit mapping decision.
export const DEFAULT_PRODUCT_CATEGORY_ID = 8;

export const PRODUCT_TYPE_LOOKUP = new Map<string, (typeof PRODUCT_TYPES)[number]>();
for (const type of PRODUCT_TYPES) {
  for (const code of type.codes) {
    PRODUCT_TYPE_LOOKUP.set(code.toUpperCase(), type);
  }
}

export const PRODUCT_TYPE_BY_ID = new Map<number, (typeof PRODUCT_TYPES)[number]>(
  PRODUCT_TYPES.map((type) => [type.id, type]),
);

export const ENTITY_TYPE_LOOKUP = new Map<string, string>();
for (const type of ENTITY_TYPES) {
  for (const code of type.codes) {
    ENTITY_TYPE_LOOKUP.set(code.toUpperCase(), type.name);
  }
}

export const RISK_BY_ID = new Map<number, TaxonomyItem>(RISKS.map((risk) => [risk.id, risk]));
export const THEME_BY_ID = new Map<number, TaxonomyItem>(THEMES.map((theme) => [theme.id, theme]));
