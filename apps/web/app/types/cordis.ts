export interface EntityRow {
  id: string;
  vat_number: string | null;
  legal_name: string | null;
  short_name: string | null;
  address_street: string | null;
  address_city: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  address_url: string | null;
  address_geolocation: string | null;
  organization_activity_type_id: number | null;
  related_region_name: string | null;
  related_region_nuts_code: string | null;
  related_region_iso_code: string | null;
  related_nuts_code_nuts_code: string | null;
  // Virtual
  projects_labels?: string[];
}

export interface ProjectRow {
  id: string;
  acronym: string | null;
  teaser: string | null;
  title: string | null;
  keywords: string | null;
  total_cost: number | null;
  ec_max_contribution: number | null;
  start_date: string | null;
  end_date: string | null;
  duration: number | null;
  risks: string | null;
  themes: string | null;
  // Virtual fields (not stored in DB)
  themes_labels?: string[];
  risks_labels?: string[];
  entities_labels?: string[];
}

export interface ProductRow {
  id: string;
  product_id: string;
  title: string | null;
  details_authors: string | null;
  details_journal_number: string | null;
  details_journal_title: string | null;
  details_published_pages: string | null;
  details_published_year: string | null;
  details_publisher: string | null;
  type_code: string | null;
  type_title: string | null;
  product_type_id: number | null;
  product_type_name: string | null;
  sub_type_code: string | null;
  sub_type_title: string | null;
  doi: string | null;
  issn: string | null;
}

export interface AuxClimateRisk {
  id: number;
  name: string;
}

export interface AuxTheme {
  id: number;
  name: string;
}

export interface AuxEntityType {
  id: number;
  name: string;
}

export interface AuxProductCategory {
  id: number;
  name: string;
}

// Custom products domain

export interface ProductBase {
  id: string;
  type: string;
  product_category_id: number;
}

export interface ProductCustom {
  product_id: string;
  title: string | null;
  description: string | null;
  URL: string | null;
  image: string[] | null;
}

export interface ProductWithCustomAndProjects extends ProductBase {
  custom?: ProductCustom | null;
  project_labels?: string[];
}


