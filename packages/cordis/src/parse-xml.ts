import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify as csvStringify } from "csv-stringify/sync";
import { XMLParser } from "fast-xml-parser";
import {
  DEFAULT_CSV_DIR,
  DEFAULT_DOWNLOADS_DIR,
  DEFAULT_RISKS_CSV_PATH,
  DEFAULT_THEMES_CSV_PATH,
  getArgValue,
} from "./paths.js";
import { loadPdfCategories } from "./pdf-categories.js";
import {
  DEFAULT_PRODUCT_CATEGORY_ID,
  ENTITY_TYPE_LOOKUP,
  ENTITY_TYPES,
  FALLBACK_ENTITY_TYPE_NAME,
  PRODUCT_TYPE_BY_ID,
  PRODUCT_TYPE_LOOKUP,
  PRODUCT_TYPES,
  RISKS,
  THEMES,
} from "./taxonomy.js";

type XmlNode = Record<string, unknown>;

export type ProjectCsvRow = {
  id: string;
  acronym: string;
  teaser: string;
  title: string;
  keywords: string;
  totalCost: number | "";
  ecMaxContribution: number | "";
  startDate: string;
  endDate: string;
  duration: number | "";
};

export type EntityCsvRow = {
  id: string;
  vatNumber: string;
  legalName: string;
  shortName: string;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
  addressUrl: string;
  addressGeolocation: string;
  organizationActivityType: string;
  relatedRegionName: string;
  relatedRegionNutsCode: string;
  relatedRegionIsoCode: string;
  relatedNutsCodeNutsCode: string;
};

export type ProjectEntityCsvRow = {
  projectId: string;
  entityId: string;
  type: string;
  order: number | "";
  totalCost: number | "";
  ecContribution: number | "";
  netEcContribution: number | "";
  sme: number;
  terminated: number;
};

export type ProductCsvRow = {
  id: string;
  projectId: string;
  title: string;
  detailsAuthors: string;
  detailsJournalNumber: string;
  detailsJournalTitle: string;
  detailsPublishedPages: string;
  detailsPublishedYear: string;
  detailsPublisher: string;
  typeCode: string;
  typeTitle: string;
  /**
   * Mapping of the CORDIS type code onto PRODUCT_TYPES; blank when the code has
   * no mapping. Mirrors the hosted `products_cordis.product_type_id` /
   * `product_type_name`, which are null/empty for unmapped codes.
   */
  productTypeId: number | "";
  productTypeName: string;
  /**
   * Always populated, falling back to DEFAULT_PRODUCT_CATEGORY_ID, because
   * `products.product_category_id` is NOT NULL.
   */
  productCategoryId: number;
  subTypeCode: string;
  subTypeTitle: string;
  doi: string;
  issn: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  trimValues: true,
});

function toArray(value: unknown): XmlNode[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as XmlNode[];
  return [value as XmlNode];
}

function asString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function parseFloatSafe(value: unknown): number | "" {
  if (value === undefined || value === null || value === "") return "";
  const num = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(num) ? num : "";
}

function hasText(value: unknown): boolean {
  return asString(value).trim().length > 0;
}

export type ParsedCordisCorpus = {
  projects: ProjectCsvRow[];
  entities: EntityCsvRow[];
  projectEntities: ProjectEntityCsvRow[];
  products: ProductCsvRow[];
  projectRisks: { projectId: string; riskId: number }[];
  projectThemes: { projectId: string; themeId: number }[];
  /** CORDIS publication type codes with no PRODUCT_TYPES mapping, and their counts. */
  unmappedProductTypeCodes: Map<string, number>;
  /** Non-fatal notes surfaced by the category loader and the entity merge. */
  warnings: string[];
};

export async function parseCordisXmlDirectory(
  downloadsDir: string,
  options: { risksCsvPath: string; themesCsvPath: string },
): Promise<ParsedCordisCorpus> {
  const files = (await readdir(downloadsDir)).filter((file) => file.endsWith(".xml"));
  if (files.length === 0) {
    throw new Error(`No XML files in ${downloadsDir}`);
  }

  const projectRecords: ProjectCsvRow[] = [];
  const entityRecords = new Map<string, EntityCsvRow>();
  const projectEntityRecords = new Map<string, ProjectEntityCsvRow>();
  const productRecords: ProductCsvRow[] = [];
  const unmappedProductTypeCodes = new Map<string, number>();
  const warnings: string[] = [];

  for (const file of files) {
    const xmlContent = await readFile(resolve(downloadsDir, file), "utf8");
    const projectData = (parser.parse(xmlContent) as { project?: XmlNode }).project;
    if (!projectData) {
      throw new Error(`${file}: missing <project> root`);
    }
    const projectId = asString(projectData.id);
    if (!projectId) {
      throw new Error(`${file}: missing project.id`);
    }

    const associations = (projectData.relations as XmlNode | undefined)?.associations as XmlNode | undefined;
    const results = toArray(associations?.result);

    projectRecords.push({
      id: projectId,
      acronym: asString(projectData.acronym),
      teaser: asString(projectData.teaser),
      title: asString(projectData.title),
      keywords: asString(projectData.keywords),
      totalCost: parseFloatSafe(projectData.totalCost),
      ecMaxContribution: parseFloatSafe(projectData.ecMaxContribution),
      startDate: asString(projectData.startDate),
      endDate: asString(projectData.endDate),
      duration: parseFloatSafe(projectData.duration),
    });

    const organizations = toArray(associations?.organization);
    for (const organization of organizations) {
      const entityId = asString(organization.id);
      if (!entityId) continue;

      const categories = toArray(
        ((organization.relations as XmlNode | undefined)?.categories as XmlNode | undefined)?.category,
      );
      const activityCategory = categories.find(
        (category) => category.classification === "organizationActivityType",
      );
      const activityCode = asString(activityCategory?.code).toUpperCase();
      const resolvedEntityType =
        ENTITY_TYPE_LOOKUP.get(activityCode) ?? asString(activityCategory?.title);

      const regions = toArray(
        ((organization.relations as XmlNode | undefined)?.regions as XmlNode | undefined)?.region,
      );
      const relatedRegion = regions.find((region) => region.type === "relatedRegion");
      const relatedNuts = regions.find((region) => region.type === "relatedNutsCode");
      const address = organization.address as XmlNode | undefined;

      const candidate: EntityCsvRow = {
        id: entityId,
        vatNumber: asString(organization.vatNumber),
        legalName: asString(organization.legalName),
        shortName: asString(organization.shortName),
        addressStreet: asString(address?.street),
        addressCity: asString(address?.city),
        addressPostalCode: asString(address?.postalCode),
        addressCountry: asString(address?.country),
        addressUrl: asString(address?.url),
        addressGeolocation: asString(address?.geolocation),
        organizationActivityType: resolvedEntityType,
        relatedRegionName: asString(relatedRegion?.name),
        relatedRegionNutsCode: asString(relatedRegion?.nutsCode),
        relatedRegionIsoCode: asString(relatedRegion?.isoCode ?? relatedRegion?.euCode),
        relatedNutsCodeNutsCode: asString(relatedNuts?.nutsCode),
      };

      const existing = entityRecords.get(entityId);
      if (!existing) {
        entityRecords.set(entityId, candidate);
      } else {
        // The same organisation appears in several projects and the records are
        // not always equally complete, so fill blanks from later occurrences
        // instead of keeping whatever the first file happened to carry.
        for (const key of Object.keys(candidate) as (keyof EntityCsvRow)[]) {
          if (!hasText(existing[key]) && hasText(candidate[key])) {
            existing[key] = candidate[key];
          }
        }
      }

      // project_entities is keyed on (project_id, entity_id); the corpus does
      // contain a repeated pair, so collapse duplicates here rather than
      // relying on the loader's ON CONFLICT.
      projectEntityRecords.set(`${projectId}|${entityId}`, {
        projectId,
        entityId,
        type: asString(organization.type),
        order: parseFloatSafe(organization.order),
        totalCost: parseFloatSafe(organization.totalCost),
        ecContribution: parseFloatSafe(organization.ecContribution),
        netEcContribution: parseFloatSafe(organization.netEcContribution),
        sme: organization.sme === "true" || organization.sme === true ? 1 : 0,
        terminated: organization.terminated === "true" || organization.terminated === true ? 1 : 0,
      });
    }

    const publications = results.filter((result) => {
      const categories = toArray(
        ((result.relations as XmlNode | undefined)?.categories as XmlNode | undefined)?.category,
      );
      return categories.some((category) => category.code === "publication");
    });

    for (const publication of publications) {
      const categories = toArray(
        ((publication.relations as XmlNode | undefined)?.categories as XmlNode | undefined)?.category,
      );
      const typeCategory = categories.find(
        (category) => asString(category.classification).toLowerCase() === "projectpublication",
      );
      const subTypeCategory = categories.find(
        (category) => asString(category.classification).toLowerCase() === "projectpublicationsubtype",
      );
      const typeCode = typeCategory?.code ? asString(typeCategory.code).toUpperCase() : "";
      const lookupKey = typeCode || asString(typeCategory?.title).toUpperCase();
      const mappedProductType = lookupKey ? PRODUCT_TYPE_LOOKUP.get(lookupKey) : undefined;

      // products.product_category_id is NOT NULL, so an unmapped code has to
      // resolve to something. Record it so `cordis:drift` can list the codes
      // that still need an explicit mapping.
      if (!mappedProductType) {
        const key = lookupKey || "(no type code)";
        unmappedProductTypeCodes.set(key, (unmappedProductTypeCodes.get(key) ?? 0) + 1);
      }
      const productType = mappedProductType ?? PRODUCT_TYPE_BY_ID.get(DEFAULT_PRODUCT_CATEGORY_ID);
      if (!productType) {
        throw new Error(
          `DEFAULT_PRODUCT_CATEGORY_ID ${DEFAULT_PRODUCT_CATEGORY_ID} is not present in PRODUCT_TYPES`,
        );
      }

      const identifiers = (publication.identifiers as XmlNode | undefined) ?? {};
      const details = (publication.details as XmlNode | undefined) ?? {};

      productRecords.push({
        id: asString(publication.id),
        projectId,
        title: asString(publication.title),
        detailsAuthors: asString(details.authors),
        detailsJournalNumber: asString(details.journalNumber),
        detailsJournalTitle: asString(details.journalTitle),
        detailsPublishedPages: asString(details.publishedPages),
        detailsPublishedYear: asString(details.publishedYear),
        detailsPublisher: asString(details.publisher),
        typeCode: asString(typeCategory?.code),
        typeTitle: asString(typeCategory?.title),
        productTypeId: mappedProductType?.id ?? "",
        productTypeName: mappedProductType?.name ?? "",
        productCategoryId: productType.id,
        subTypeCode: asString(subTypeCategory?.code),
        subTypeTitle: asString(subTypeCategory?.title),
        doi: asString(identifiers.doi),
        issn: asString(identifiers.issn),
      });
    }
  }

  const categories = await loadPdfCategories({
    risksCsvPath: options.risksCsvPath,
    themesCsvPath: options.themesCsvPath,
    knownProjectIds: projectRecords.map((project) => project.id),
  });
  warnings.push(...categories.warnings);

  return {
    projects: projectRecords,
    entities: [...entityRecords.values()],
    projectEntities: [...projectEntityRecords.values()],
    products: productRecords,
    projectRisks: categories.projectRisks.map(({ projectId, categoryId }) => ({
      projectId,
      riskId: categoryId,
    })),
    projectThemes: categories.projectThemes.map(({ projectId, categoryId }) => ({
      projectId,
      themeId: categoryId,
    })),
    unmappedProductTypeCodes,
    warnings,
  };
}

async function writeCsv(
  csvDir: string,
  filename: string,
  records: Record<string, unknown>[],
  columns: string[],
) {
  const csv = csvStringify(records, { header: true, columns });
  await writeFile(resolve(csvDir, filename), csv);
}

export async function writeCordisCsvs(
  csvDir: string,
  parsed: Awaited<ReturnType<typeof parseCordisXmlDirectory>>,
) {
  await mkdir(csvDir, { recursive: true });

  await writeCsv(csvDir, "projects_cordis.csv", parsed.projects as unknown as Record<string, unknown>[], [
    "id",
    "acronym",
    "teaser",
    "title",
    "keywords",
    "totalCost",
    "ecMaxContribution",
    "startDate",
    "endDate",
    "duration",
  ]);
  await writeCsv(csvDir, "entities_cordis.csv", parsed.entities as unknown as Record<string, unknown>[], [
    "id",
    "vatNumber",
    "legalName",
    "shortName",
    "addressStreet",
    "addressCity",
    "addressPostalCode",
    "addressCountry",
    "addressUrl",
    "addressGeolocation",
    "organizationActivityType",
    "relatedRegionName",
    "relatedRegionNutsCode",
    "relatedRegionIsoCode",
    "relatedNutsCodeNutsCode",
  ]);
  await writeCsv(csvDir, "project_entities.csv", parsed.projectEntities as unknown as Record<string, unknown>[], [
    "projectId",
    "entityId",
    "type",
    "order",
    "totalCost",
    "ecContribution",
    "netEcContribution",
    "sme",
    "terminated",
  ]);
  await writeCsv(csvDir, "products_cordis.csv", parsed.products as unknown as Record<string, unknown>[], [
    "id",
    "projectId",
    "title",
    "detailsAuthors",
    "detailsJournalNumber",
    "detailsJournalTitle",
    "detailsPublishedPages",
    "detailsPublishedYear",
    "detailsPublisher",
    "typeCode",
    "typeTitle",
    "productTypeId",
    "productTypeName",
    "productCategoryId",
    "subTypeCode",
    "subTypeTitle",
    "doi",
    "issn",
  ]);
  await writeCsv(csvDir, "project_risks.csv", parsed.projectRisks as unknown as Record<string, unknown>[], [
    "projectId",
    "riskId",
  ]);
  await writeCsv(csvDir, "project_themes.csv", parsed.projectThemes as unknown as Record<string, unknown>[], [
    "projectId",
    "themeId",
  ]);
  await writeCsv(
    csvDir,
    "aux_climate_risks.csv",
    RISKS.map(({ id, name }) => ({ id, name })),
    ["id", "name"],
  );
  await writeCsv(
    csvDir,
    "aux_themes.csv",
    THEMES.map(({ id, name }) => ({ id, name })),
    ["id", "name"],
  );
  await writeCsv(
    csvDir,
    "aux_entity_types.csv",
    ENTITY_TYPES.map(({ name }) => ({ name })),
    ["name"],
  );
  await writeCsv(
    csvDir,
    "aux_product_categories.csv",
    PRODUCT_TYPES.map(({ id, name }) => ({ id, name })),
    ["id", "name"],
  );
}

async function main() {
  const downloadsDir = getArgValue("--downloadsDir") ?? DEFAULT_DOWNLOADS_DIR;
  const csvDir = getArgValue("--csvDir") ?? DEFAULT_CSV_DIR;
  const risksCsvPath = getArgValue("--risksCsv") ?? DEFAULT_RISKS_CSV_PATH;
  const themesCsvPath = getArgValue("--themesCsv") ?? DEFAULT_THEMES_CSV_PATH;

  const parsed = await parseCordisXmlDirectory(resolve(downloadsDir), {
    risksCsvPath: resolve(risksCsvPath),
    themesCsvPath: resolve(themesCsvPath),
  });
  await writeCordisCsvs(resolve(csvDir), parsed);

  for (const warning of parsed.warnings) {
    console.warn(`WARN  ${warning}`);
  }
  if (parsed.unmappedProductTypeCodes.size > 0) {
    const codes = [...parsed.unmappedProductTypeCodes.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => `${code} (${count})`)
      .join(", ");
    console.warn(
      `WARN  ${parsed.unmappedProductTypeCodes.size} CORDIS publication type code(s) have no PRODUCT_TYPES ` +
        `mapping and fell back to category ${DEFAULT_PRODUCT_CATEGORY_ID}: ${codes}`,
    );
  }

  console.log(
    [
      "CSV export completed:",
      `  projects:         ${parsed.projects.length}`,
      `  entities:         ${parsed.entities.length}`,
      `  project_entities: ${parsed.projectEntities.length}`,
      `  project_risks:    ${parsed.projectRisks.length}`,
      `  project_themes:   ${parsed.projectThemes.length}`,
      `  products:         ${parsed.products.length}`,
      `Files written to ${csvDir}`,
    ].join("\n"),
  );
}

const isDirectRun = process.argv[1]?.endsWith("parse-xml.ts") || process.argv[1]?.endsWith("parse-xml.js");
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
