import { z } from "zod";

export const ImageSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
});

export const AdaptOptionSchema = z.object({
  label: z.string(),
  url: z.string(),
});

export const WebsiteLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

export const ReferenceSchema = z.object({
  title: z.string(),
  url: z.string(),
});

export const CaseStudyDocumentSchema = z.object({
  title: z.string(),
  url: z.string(),
});

export const GeographicCharacterisationSchema = z.object({
  continent: z.string().optional(),
  macro_transnational_region: z.string().optional(),
  countries: z.string().optional(),
  sub_nationals: z.string().optional(),
  city: z.string().optional(),
});

export const ExtractedCaseStudySchema = z
  .object({
    source_url: z.string().optional(),
    source_file: z.string(), // e.g. "page_0.html"
    lang: z.string(), // "en" for these files

    title: z.string().optional(),
    subtitle: z.string().optional(),

    image_url: z.string().optional(),
    images: z.array(ImageSchema).optional(),

    adapt_options: z.array(AdaptOptionSchema).optional(),

    contact: z.string().optional(),
    websites: z.array(WebsiteLinkSchema).optional(),
    references: z.array(ReferenceSchema).optional(),

    creation_date: z.string().optional(),

    keywords: z.array(z.string()).optional(),
    climate_impacts: z.array(z.string()).optional(),
    adaptation_approaches: z.array(z.string()).optional(),
    sectors: z.array(z.string()).optional(),

    geographic_characterisation: GeographicCharacterisationSchema.optional(),

    policy_legal_background: z.string().optional(),
    objectives: z.string().optional(),
    solutions: z.string().optional(),
    cost_benefit: z.string().optional(),
    implementation_time: z.string().optional(),

    case_study_documents: z.array(CaseStudyDocumentSchema).optional(),

    fulltext: z.string().optional(),
  })
  .passthrough(); // allow future extra fields if schema evolves
export const LocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const ImplementationYearsSchema = z.object({
  start_year: z.string(), // "" allowed, stored as empty string when unknown
  end_year: z.string(),
});

export const AugmentedCaseStudyEnSchema = ExtractedCaseStudySchema.extend({
  lang: z.literal("en"),

  // AI / enrichment fields
  location: LocationSchema.optional(),
  implementation_years: ImplementationYearsSchema.optional(),

  references_preprocessed: z.string().optional(),
  contact_preprocessed: z.string().optional(),

  summary: z.string().optional(), // 1–2 paragraph summary of fulltext
}).passthrough();

export const TranslatedCaseStudySchema = z.object({
  // Foreign key back to original HTML / record
  source_file: z.string(), // e.g. "page_0.html"

  // Target language of this translation (e.g. "es", "fr", ...)
  lang: z.string(),

  // Only user-visible translated fields
  title: z.string().optional(),
  subtitle: z.string().optional(),
  summary: z.string().optional(),
  fulltext: z.string().optional(),
});

export type TranslatedCaseStudy = z.infer<typeof TranslatedCaseStudySchema>;

export type AugmentedCaseStudyEn = z.infer<typeof AugmentedCaseStudyEnSchema>;

export type ExtractedCaseStudy = z.infer<typeof ExtractedCaseStudySchema>;
