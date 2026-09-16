import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { sql } from "./config.js";
import { DEFAULT_AUDIT_DIR, DEFAULT_CSV_DIR, getArgValue, hasFlag } from "./paths.js";
import { markdownTable, nowStamp, truncate, writeCsvReport, writeTextReport } from "./report.js";
import { DEFAULT_PRODUCT_CATEGORY_ID, FALLBACK_ENTITY_TYPE_NAME } from "./taxonomy.js";

type CsvRow = Record<string, string>;
type Tx = typeof sql;

const CHUNK_SIZE = 500;

/** Thrown to roll back the transaction when --dry-run is set. */
class DryRunRollback extends Error {
  constructor() {
    super("dry run");
  }
}

function readCsv(csvDir: string, filename: string): CsvRow[] {
  const content = readFileSync(resolve(csvDir, filename), "utf8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CsvRow[];
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function toNumberOrNull(value: string | undefined): number | null {
  const cleaned = emptyToNull(value);
  if (cleaned === null) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function toIntegerOrNull(value: string | undefined): number | null {
  const num = toNumberOrNull(value);
  return num === null ? null : Math.trunc(num);
}

async function inChunks<T>(rows: T[], run: (chunk: T[]) => Promise<unknown>): Promise<void> {
  for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
    await run(rows.slice(index, index + CHUNK_SIZE));
  }
}

// ---------------------------------------------------------------------------
// Diff collection
// ---------------------------------------------------------------------------

type FieldChange = {
  table: string;
  cordis_id: string;
  label: string;
  column: string;
  before: string;
  after: string;
};

type TagChange = {
  cordis_id: string;
  acronym: string;
  kind: "risk" | "theme";
  tag_id: number;
  tag_name: string;
  action: "added" | "removed";
};

function normaliseForCompare(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

/**
 * Keeps a value the database already holds when the new CORDIS record omits it.
 *
 * A later catalogue edition sometimes drops a field it previously carried (a few
 * organisations lose their shortName, for instance). Overwriting with null would
 * blank a name the Hub displays, so absent is treated as "no new information"
 * rather than as "cleared". Real changes still overwrite.
 */
function preserveExistingValues<T extends Record<string, unknown>>(
  row: T,
  existing: Record<string, unknown> | undefined,
): T {
  if (!existing) return row;
  for (const column of Object.keys(row) as (keyof T)[]) {
    const incoming = row[column];
    const previous = existing[column as string];
    if (incoming === null && previous !== null && previous !== undefined) {
      row[column] = previous as T[keyof T];
    }
  }
  return row;
}

function diffRow(
  table: string,
  cordisId: string,
  label: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const column of Object.keys(after)) {
    const previous = normaliseForCompare(before[column]);
    const next = normaliseForCompare(after[column]);
    if (previous !== next) {
      changes.push({ table, cordis_id: cordisId, label, column, before: previous, after: next });
    }
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Row builders. Column keys are snake_case so postgres.js can expand them.
// ---------------------------------------------------------------------------

const PROJECT_COLUMNS = [
  "cordis_id",
  "acronym",
  "teaser",
  "title",
  "keywords",
  "total_cost",
  "ec_max_contribution",
  "start_date",
  "end_date",
  "duration",
] as const;

function buildProjectRow(row: CsvRow) {
  return {
    cordis_id: emptyToNull(row.id),
    acronym: emptyToNull(row.acronym),
    teaser: emptyToNull(row.teaser),
    title: emptyToNull(row.title),
    keywords: emptyToNull(row.keywords),
    total_cost: toNumberOrNull(row.totalCost),
    ec_max_contribution: toNumberOrNull(row.ecMaxContribution),
    start_date: emptyToNull(row.startDate),
    end_date: emptyToNull(row.endDate),
    duration: toIntegerOrNull(row.duration),
  };
}

const ENTITY_COLUMNS = [
  "cordis_id",
  "vat_number",
  "legal_name",
  "short_name",
  "address_street",
  "address_city",
  "address_postal_code",
  "address_country",
  "address_url",
  "address_geolocation",
  "organization_activity_type_id",
  "related_region_name",
  "related_region_nuts_code",
  "related_region_iso_code",
  "related_nuts_code_nuts_code",
] as const;

function buildEntityRow(row: CsvRow, activityTypeId: number) {
  return {
    cordis_id: emptyToNull(row.id),
    vat_number: emptyToNull(row.vatNumber),
    legal_name: emptyToNull(row.legalName),
    short_name: emptyToNull(row.shortName),
    address_street: emptyToNull(row.addressStreet),
    address_city: emptyToNull(row.addressCity),
    address_postal_code: emptyToNull(row.addressPostalCode),
    address_country: emptyToNull(row.addressCountry),
    address_url: emptyToNull(row.addressUrl),
    address_geolocation: emptyToNull(row.addressGeolocation),
    organization_activity_type_id: activityTypeId,
    related_region_name: emptyToNull(row.relatedRegionName),
    related_region_nuts_code: emptyToNull(row.relatedRegionNutsCode),
    related_region_iso_code: emptyToNull(row.relatedRegionIsoCode),
    related_nuts_code_nuts_code: emptyToNull(row.relatedNutsCodeNutsCode),
  };
}

const PRODUCT_CORDIS_COLUMNS = [
  "product_id",
  "cordis_id",
  "title",
  "details_authors",
  "details_journal_number",
  "details_journal_title",
  "details_published_pages",
  "details_published_year",
  "details_publisher",
  "type_code",
  "type_title",
  "product_type_id",
  "product_type_name",
  "sub_type_code",
  "sub_type_title",
  "doi",
  "issn",
] as const;

// ---------------------------------------------------------------------------

async function main() {
  const csvDir = getArgValue("--csvDir") ?? DEFAULT_CSV_DIR;
  const outDir = getArgValue("--outDir") ?? DEFAULT_AUDIT_DIR;
  const dryRun = hasFlag("--dry-run");
  const stamp = nowStamp();

  const projects = readCsv(csvDir, "projects_cordis.csv");
  const entities = readCsv(csvDir, "entities_cordis.csv");
  const projectEntities = readCsv(csvDir, "project_entities.csv");
  const products = readCsv(csvDir, "products_cordis.csv");
  const projectRisks = readCsv(csvDir, "project_risks.csv");
  const projectThemes = readCsv(csvDir, "project_themes.csv");
  const auxRisks = readCsv(csvDir, "aux_climate_risks.csv");
  const auxThemes = readCsv(csvDir, "aux_themes.csv");
  const auxEntityTypes = readCsv(csvDir, "aux_entity_types.csv");
  const auxProductCategories = readCsv(csvDir, "aux_product_categories.csv");

  if (projects.length === 0) {
    throw new Error(
      `${csvDir}/projects_cordis.csv has no rows. Run \`pnpm cordis:parse\` before pushing.`,
    );
  }

  console.log(
    `Loading ${projects.length} projects, ${entities.length} entities, ` +
      `${projectEntities.length} project-entity links, ${products.length} products, ` +
      `${projectRisks.length} risk tags, ${projectThemes.length} theme tags` +
      `${dryRun ? " (DRY RUN, will roll back)" : ""}`,
  );

  const fieldChanges: FieldChange[] = [];
  const tagChanges: TagChange[] = [];
  const skipped: string[] = [];
  const stale: string[] = [];
  let counts: { table: string; n: string }[] = [];

  try {
    await sql.begin(async (rawTx) => {
      const tx = rawTx as unknown as Tx;

      // ---- aux tables -----------------------------------------------------
      await inChunks(auxRisks, (chunk) => {
        const rows = chunk.map((row) => ({
          id: toIntegerOrNull(row.id),
          name: emptyToNull(row.name),
        }));
        return tx`
          INSERT INTO public.aux_climate_risks ${tx(rows, "id", "name")}
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        `;
      });

      await inChunks(auxThemes, (chunk) => {
        const rows = chunk.map((row) => ({
          id: toIntegerOrNull(row.id),
          name: emptyToNull(row.name),
        }));
        return tx`
          INSERT INTO public.aux_themes ${tx(rows, "id", "name")}
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        `;
      });

      await inChunks(auxEntityTypes, (chunk) => {
        const rows = chunk.map((row) => ({ name: emptyToNull(row.name) }));
        return tx`
          INSERT INTO public.aux_entity_types ${tx(rows, "name")}
          ON CONFLICT (name) DO NOTHING
        `;
      });

      await inChunks(auxProductCategories, (chunk) => {
        const rows = chunk.map((row) => ({
          id: toIntegerOrNull(row.id),
          name: emptyToNull(row.name),
        }));
        return tx`
          INSERT INTO public.aux_product_categories ${tx(rows, "id", "name")}
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        `;
      });

      const entityTypeRows = await tx<{ id: number; name: string }[]>`
        SELECT id, name FROM public.aux_entity_types
      `;
      const entityTypeIdByName = new Map(entityTypeRows.map((r) => [r.name, r.id]));
      const fallbackEntityTypeId = entityTypeIdByName.get(FALLBACK_ENTITY_TYPE_NAME);
      if (fallbackEntityTypeId === undefined) {
        throw new Error(
          `aux_entity_types has no "${FALLBACK_ENTITY_TYPE_NAME}" row; ` +
            `entities_cordis.organization_activity_type_id is NOT NULL and needs a fallback.`,
        );
      }

      // ---- projects -------------------------------------------------------
      const projectRows = projects.map(buildProjectRow);
      const projectCordisIds = projectRows
        .map((row) => row.cordis_id)
        .filter((id): id is string => Boolean(id));

      const existingProjects = await tx<Record<string, unknown>[]>`
        SELECT ${tx(PROJECT_COLUMNS as unknown as string[])}
        FROM public.projects_cordis
        WHERE cordis_id IN ${tx(projectCordisIds)}
      `;
      const existingProjectByCordis = new Map(
        existingProjects.map((row) => [String(row.cordis_id), row]),
      );
      for (const row of projectRows) {
        if (!row.cordis_id) continue;
        const before = existingProjectByCordis.get(row.cordis_id);
        if (!before) continue;
        preserveExistingValues(row, before);
        fieldChanges.push(
          ...diffRow("projects_cordis", row.cordis_id, String(row.acronym ?? ""), before, row),
        );
      }

      await inChunks(projectRows, (chunk) =>
        tx`
          INSERT INTO public.projects_cordis ${tx(chunk, ...PROJECT_COLUMNS)}
          ON CONFLICT (cordis_id) DO UPDATE SET
            acronym = EXCLUDED.acronym,
            teaser = EXCLUDED.teaser,
            title = EXCLUDED.title,
            keywords = EXCLUDED.keywords,
            total_cost = EXCLUDED.total_cost,
            ec_max_contribution = EXCLUDED.ec_max_contribution,
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date,
            duration = EXCLUDED.duration
        `,
      );

      // ---- entities -------------------------------------------------------
      const entityRows = entities.map((row) => {
        const name = row.organizationActivityType?.trim() ?? "";
        const resolved = name ? entityTypeIdByName.get(name) : undefined;
        if (name && resolved === undefined) {
          skipped.push(
            `entity ${row.id}: unknown organizationActivityType "${name}", ` +
              `fell back to "${FALLBACK_ENTITY_TYPE_NAME}"`,
          );
        }
        return buildEntityRow(row, resolved ?? fallbackEntityTypeId);
      });
      const entityCordisIds = entityRows
        .map((row) => row.cordis_id)
        .filter((id): id is string => Boolean(id));

      const existingEntities = await tx<Record<string, unknown>[]>`
        SELECT ${tx(ENTITY_COLUMNS as unknown as string[])}
        FROM public.entities_cordis
        WHERE cordis_id IN ${tx(entityCordisIds)}
      `;
      const existingEntityByCordis = new Map(
        existingEntities.map((row) => [String(row.cordis_id), row]),
      );
      for (const row of entityRows) {
        if (!row.cordis_id) continue;
        const before = existingEntityByCordis.get(row.cordis_id);
        if (!before) continue;
        preserveExistingValues(row, before);
        fieldChanges.push(
          ...diffRow("entities_cordis", row.cordis_id, String(row.short_name ?? ""), before, row),
        );
      }

      await inChunks(entityRows, (chunk) =>
        tx`
          INSERT INTO public.entities_cordis ${tx(chunk, ...ENTITY_COLUMNS)}
          ON CONFLICT (cordis_id) DO UPDATE SET
            vat_number = EXCLUDED.vat_number,
            legal_name = EXCLUDED.legal_name,
            short_name = EXCLUDED.short_name,
            address_street = EXCLUDED.address_street,
            address_city = EXCLUDED.address_city,
            address_postal_code = EXCLUDED.address_postal_code,
            address_country = EXCLUDED.address_country,
            address_url = EXCLUDED.address_url,
            address_geolocation = EXCLUDED.address_geolocation,
            organization_activity_type_id = EXCLUDED.organization_activity_type_id,
            related_region_name = EXCLUDED.related_region_name,
            related_region_nuts_code = EXCLUDED.related_region_nuts_code,
            related_region_iso_code = EXCLUDED.related_region_iso_code,
            related_nuts_code_nuts_code = EXCLUDED.related_nuts_code_nuts_code
        `,
      );

      // ---- cordis_id -> uuid maps -----------------------------------------
      const projectIdRows = await tx<{ id: string; cordis_id: string; acronym: string | null }[]>`
        SELECT id::text, cordis_id, acronym FROM public.projects_cordis
      `;
      const entityIdRows = await tx<{ id: string; cordis_id: string }[]>`
        SELECT id::text, cordis_id FROM public.entities_cordis
      `;
      const projectUuidByCordis = new Map(projectIdRows.map((r) => [r.cordis_id, r.id]));
      const entityUuidByCordis = new Map(entityIdRows.map((r) => [r.cordis_id, r.id]));
      const acronymByCordis = new Map(projectIdRows.map((r) => [r.cordis_id, r.acronym ?? ""]));
      const cordisByProjectUuid = new Map(projectIdRows.map((r) => [r.id, r.cordis_id]));

      const sourceProjectUuids = [
        ...new Set(
          projects
            .map((p) => projectUuidByCordis.get(p.id))
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      // ---- tag diff, before the join tables are replaced ------------------
      const existingRiskRows = await tx<{ project_id: string; risk_id: number; name: string }[]>`
        SELECT pr.project_id::text, pr.risk_id, r.name
        FROM public.project_risks pr
        JOIN public.aux_climate_risks r ON r.id = pr.risk_id
        WHERE pr.project_id IN ${tx(sourceProjectUuids)}
      `;
      const existingThemeRows = await tx<{ project_id: string; theme_id: number; name: string }[]>`
        SELECT pt.project_id::text, pt.theme_id, t.name
        FROM public.project_themes pt
        JOIN public.aux_themes t ON t.id = pt.theme_id
        WHERE pt.project_id IN ${tx(sourceProjectUuids)}
      `;

      const riskNameById = new Map(
        auxRisks.map((row) => [toIntegerOrNull(row.id) ?? -1, row.name ?? ""]),
      );
      const themeNameById = new Map(
        auxThemes.map((row) => [toIntegerOrNull(row.id) ?? -1, row.name ?? ""]),
      );

      const collectTagChanges = (
        kind: "risk" | "theme",
        existing: { projectUuid: string; tagId: number; name: string }[],
        incoming: CsvRow[],
        idField: "riskId" | "themeId",
        nameById: Map<number, string>,
      ) => {
        const beforeSet = new Set<string>();
        const beforeNames = new Map<string, string>();
        for (const row of existing) {
          const cordisId = cordisByProjectUuid.get(row.projectUuid);
          if (!cordisId) continue;
          const key = `${cordisId}|${row.tagId}`;
          beforeSet.add(key);
          beforeNames.set(key, row.name);
        }

        const afterSet = new Set<string>();
        for (const row of incoming) {
          const tagId = toIntegerOrNull(row[idField]);
          if (tagId === null) continue;
          afterSet.add(`${row.projectId}|${tagId}`);
        }

        for (const key of afterSet) {
          if (beforeSet.has(key)) continue;
          const [cordisId, rawId] = key.split("|");
          const tagId = Number(rawId);
          tagChanges.push({
            cordis_id: cordisId,
            acronym: acronymByCordis.get(cordisId) ?? "",
            kind,
            tag_id: tagId,
            tag_name: nameById.get(tagId) ?? "",
            action: "added",
          });
        }
        for (const key of beforeSet) {
          if (afterSet.has(key)) continue;
          const [cordisId, rawId] = key.split("|");
          const tagId = Number(rawId);
          tagChanges.push({
            cordis_id: cordisId,
            acronym: acronymByCordis.get(cordisId) ?? "",
            kind,
            tag_id: tagId,
            tag_name: beforeNames.get(key) ?? nameById.get(tagId) ?? "",
            action: "removed",
          });
        }
      };

      collectTagChanges(
        "risk",
        existingRiskRows.map((row) => ({
          projectUuid: row.project_id,
          tagId: row.risk_id,
          name: row.name,
        })),
        projectRisks,
        "riskId",
        riskNameById,
      );
      collectTagChanges(
        "theme",
        existingThemeRows.map((row) => ({
          projectUuid: row.project_id,
          tagId: row.theme_id,
          name: row.name,
        })),
        projectThemes,
        "themeId",
        themeNameById,
      );

      // ---- replace join tables for the projects in this batch -------------
      if (sourceProjectUuids.length > 0) {
        await tx`
          DELETE FROM public.project_entities
          WHERE project_id IN ${tx(sourceProjectUuids)}
        `;
        await tx`
          DELETE FROM public.project_risks
          WHERE project_id IN ${tx(sourceProjectUuids)}
        `;
        await tx`
          DELETE FROM public.project_themes
          WHERE project_id IN ${tx(sourceProjectUuids)}
        `;
      }

      // ---- project_entities ----------------------------------------------
      const projectEntityRows = projectEntities.flatMap((row) => {
        const projectId = projectUuidByCordis.get(row.projectId);
        const entityId = entityUuidByCordis.get(row.entityId);
        if (!projectId || !entityId) {
          skipped.push(
            `project_entities ${row.projectId}/${row.entityId}: project or entity not in database`,
          );
          return [];
        }
        return [
          {
            project_id: projectId,
            entity_id: entityId,
            // type and entity_order are NOT NULL on the hosted database.
            type: emptyToNull(row.type) ?? "participant",
            entity_order: toIntegerOrNull(row.order) ?? 0,
            total_cost: toNumberOrNull(row.totalCost),
            ec_contribution: toNumberOrNull(row.ecContribution),
            net_ec_contribution: toNumberOrNull(row.netEcContribution),
            sme: toIntegerOrNull(row.sme) ?? 0,
            terminated: toIntegerOrNull(row.terminated) ?? 0,
          },
        ];
      });

      await inChunks(projectEntityRows, (chunk) =>
        tx`
          INSERT INTO public.project_entities ${tx(
            chunk,
            "project_id",
            "entity_id",
            "type",
            "entity_order",
            "total_cost",
            "ec_contribution",
            "net_ec_contribution",
            "sme",
            "terminated",
          )}
          ON CONFLICT (project_id, entity_id) DO UPDATE SET
            type = EXCLUDED.type,
            entity_order = EXCLUDED.entity_order,
            total_cost = EXCLUDED.total_cost,
            ec_contribution = EXCLUDED.ec_contribution,
            net_ec_contribution = EXCLUDED.net_ec_contribution,
            sme = EXCLUDED.sme,
            terminated = EXCLUDED.terminated
        `,
      );

      // ---- project_risks / project_themes --------------------------------
      const riskRows = projectRisks.flatMap((row) => {
        const projectId = projectUuidByCordis.get(row.projectId);
        const riskId = toIntegerOrNull(row.riskId);
        if (!projectId || riskId === null) return [];
        return [{ project_id: projectId, risk_id: riskId }];
      });
      await inChunks(riskRows, (chunk) =>
        tx`
          INSERT INTO public.project_risks ${tx(chunk, "project_id", "risk_id")}
          ON CONFLICT (project_id, risk_id) DO NOTHING
        `,
      );

      const themeRows = projectThemes.flatMap((row) => {
        const projectId = projectUuidByCordis.get(row.projectId);
        const themeId = toIntegerOrNull(row.themeId);
        if (!projectId || themeId === null) return [];
        return [{ project_id: projectId, theme_id: themeId }];
      });
      await inChunks(themeRows, (chunk) =>
        tx`
          INSERT INTO public.project_themes ${tx(chunk, "project_id", "theme_id")}
          ON CONFLICT (project_id, theme_id) DO NOTHING
        `,
      );

      // ---- products ------------------------------------------------------
      const productRows = products.flatMap((row) => {
        const cordisId = emptyToNull(row.id);
        if (!cordisId) {
          skipped.push(`product with empty id skipped (project ${row.projectId})`);
          return [];
        }
        // products.product_category_id is NOT NULL, so never send null here.
        const categoryId =
          toIntegerOrNull(row.productCategoryId) ??
          toIntegerOrNull(row.productTypeId) ??
          DEFAULT_PRODUCT_CATEGORY_ID;
        return [{ csv: row, cordisId, categoryId }];
      });

      const productCordisIds = productRows.map((row) => row.cordisId);
      if (productCordisIds.length > 0) {
        const existingProducts = await tx<
          { cordis_id: string; product_category_id: number | null }[]
        >`
          SELECT cordis_id, product_category_id
          FROM public.products
          WHERE cordis_id IN ${tx(productCordisIds)}
        `;
        const existingCategoryByCordis = new Map(
          existingProducts.map((row) => [row.cordis_id, row.product_category_id]),
        );
        for (const row of productRows) {
          if (!existingCategoryByCordis.has(row.cordisId)) continue;
          const before = existingCategoryByCordis.get(row.cordisId);
          if (normaliseForCompare(before) === normaliseForCompare(row.categoryId)) continue;
          fieldChanges.push({
            table: "products",
            cordis_id: row.cordisId,
            label: truncate(row.csv.title ?? "", 60),
            column: "product_category_id",
            before: normaliseForCompare(before),
            after: String(row.categoryId),
          });
        }
      }

      await inChunks(productRows, (chunk) => {
        const rows = chunk.map((row) => ({
          cordis_id: row.cordisId,
          type: "cordis",
          product_category_id: row.categoryId,
        }));
        return tx`
          INSERT INTO public.products ${tx(rows, "cordis_id", "type", "product_category_id")}
          ON CONFLICT (cordis_id) DO UPDATE SET
            product_category_id = EXCLUDED.product_category_id
        `;
      });

      const productIdRows = await tx<{ id: string; cordis_id: string }[]>`
        SELECT id::text, cordis_id FROM public.products WHERE cordis_id IS NOT NULL
      `;
      const productUuidByCordis = new Map(productIdRows.map((r) => [r.cordis_id, r.id]));

      const productCordisRows = productRows.flatMap(({ csv, cordisId }) => {
        const productId = productUuidByCordis.get(cordisId);
        if (!productId) {
          skipped.push(`product ${cordisId}: uuid lookup failed after upsert`);
          return [];
        }
        return [
          {
            product_id: productId,
            cordis_id: cordisId,
            title: emptyToNull(csv.title),
            details_authors: emptyToNull(csv.detailsAuthors),
            details_journal_number: emptyToNull(csv.detailsJournalNumber),
            details_journal_title: emptyToNull(csv.detailsJournalTitle),
            details_published_pages: emptyToNull(csv.detailsPublishedPages),
            details_published_year: emptyToNull(csv.detailsPublishedYear),
            details_publisher: emptyToNull(csv.detailsPublisher),
            type_code: emptyToNull(csv.typeCode),
            type_title: emptyToNull(csv.typeTitle),
            product_type_id: toIntegerOrNull(csv.productTypeId),
            product_type_name: emptyToNull(csv.productTypeName),
            sub_type_code: emptyToNull(csv.subTypeCode),
            sub_type_title: emptyToNull(csv.subTypeTitle),
            doi: emptyToNull(csv.doi),
            issn: emptyToNull(csv.issn),
          },
        ];
      });

      await inChunks(productCordisRows, (chunk) =>
        tx`
          INSERT INTO public.products_cordis ${tx(chunk, ...PRODUCT_CORDIS_COLUMNS)}
          ON CONFLICT (product_id) DO UPDATE SET
            cordis_id = EXCLUDED.cordis_id,
            title = EXCLUDED.title,
            details_authors = EXCLUDED.details_authors,
            details_journal_number = EXCLUDED.details_journal_number,
            details_journal_title = EXCLUDED.details_journal_title,
            details_published_pages = EXCLUDED.details_published_pages,
            details_published_year = EXCLUDED.details_published_year,
            details_publisher = EXCLUDED.details_publisher,
            type_code = EXCLUDED.type_code,
            type_title = EXCLUDED.type_title,
            product_type_id = EXCLUDED.product_type_id,
            product_type_name = EXCLUDED.product_type_name,
            sub_type_code = EXCLUDED.sub_type_code,
            sub_type_title = EXCLUDED.sub_type_title,
            doi = EXCLUDED.doi,
            issn = EXCLUDED.issn
        `,
      );

      // Re-link only the publications in this batch. Deleting by project instead
      // would strip the links of publications CORDIS has since withdrawn,
      // leaving unreachable rows behind; those are reported below instead.
      const incomingProductUuids = productRows.flatMap(({ cordisId }) => {
        const productId = productUuidByCordis.get(cordisId);
        return productId ? [productId] : [];
      });
      await inChunks(incomingProductUuids, (chunk) =>
        tx`DELETE FROM public.product_projects WHERE product_id IN ${tx(chunk)}`,
      );

      const productProjectRows = productRows.flatMap(({ csv, cordisId }) => {
        const productId = productUuidByCordis.get(cordisId);
        const projectId = projectUuidByCordis.get(csv.projectId);
        if (!productId || !projectId) return [];
        return [{ product_id: productId, project_id: projectId }];
      });
      await inChunks(productProjectRows, (chunk) =>
        tx`
          INSERT INTO public.product_projects ${tx(chunk, "product_id", "project_id")}
          ON CONFLICT (product_id, project_id) DO NOTHING
        `,
      );

      // Rows the previous batch loaded that this one no longer mentions. The
      // loader never deletes catalogue data, so they are listed for a human.
      const staleProducts = await tx<{ cordis_id: string; title: string | null }[]>`
        SELECT pc.cordis_id, pc.title
        FROM public.products_cordis pc
        JOIN public.products p ON p.id = pc.product_id
        WHERE p.type = 'cordis'
          AND pc.cordis_id NOT IN ${tx(productCordisIds.length ? productCordisIds : [""])}
      `;
      for (const row of staleProducts) {
        stale.push(
          `publication ${row.cordis_id} ("${truncate(row.title ?? "", 60)}") is in the database but ` +
            "no longer in the CORDIS corpus; kept with its existing project link",
        );
      }

      const staleEntities = await tx<{ cordis_id: string; short_name: string | null }[]>`
        SELECT e.cordis_id, e.short_name
        FROM public.entities_cordis e
        WHERE e.cordis_id NOT IN ${tx(entityCordisIds.length ? entityCordisIds : [""])}
      `;
      for (const row of staleEntities) {
        stale.push(
          `organisation ${row.cordis_id} (${row.short_name ?? "?"}) is in the database but no longer ` +
            "listed in any project's consortium; its project_entities links were removed",
        );
      }

      counts = await tx<{ table: string; n: string }[]>`
        SELECT 'projects_cordis' AS "table", count(*)::text AS n FROM public.projects_cordis
        UNION ALL SELECT 'entities_cordis', count(*)::text FROM public.entities_cordis
        UNION ALL SELECT 'project_entities', count(*)::text FROM public.project_entities
        UNION ALL SELECT 'project_risks', count(*)::text FROM public.project_risks
        UNION ALL SELECT 'project_themes', count(*)::text FROM public.project_themes
        UNION ALL SELECT 'products', count(*)::text FROM public.products
        UNION ALL SELECT 'products_cordis', count(*)::text FROM public.products_cordis
        UNION ALL SELECT 'products_custom', count(*)::text FROM public.products_custom
        UNION ALL SELECT 'product_projects', count(*)::text FROM public.product_projects
      `;

      if (dryRun) throw new DryRunRollback();
    });
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error;
  }

  const reportPaths = await writeChangeReports({
    outDir,
    stamp,
    dryRun,
    fieldChanges,
    tagChanges,
    skipped,
    stale,
    counts,
  });

  console.log(
    dryRun
      ? "\nDRY RUN complete. Transaction rolled back; nothing was written to the database."
      : "\nCORDIS upsert committed.",
  );
  console.log("Row counts as seen inside the transaction:");
  for (const row of counts) {
    console.log(`  ${row.table}: ${row.n}`);
  }
  console.log(
    `\nTag changes: ${tagChanges.length} ` +
      `(${tagChanges.filter((c) => c.action === "added").length} added, ` +
      `${tagChanges.filter((c) => c.action === "removed").length} removed)`,
  );
  console.log(`Field changes on existing rows: ${fieldChanges.length}`);
  if (stale.length > 0) console.log(`Rows no longer in the CORDIS corpus (kept): ${stale.length}`);
  if (skipped.length > 0) console.log(`Skipped / adjusted rows: ${skipped.length}`);
  for (const path of reportPaths) {
    console.log(`Report: ${path}`);
  }

  await sql.end();
}

async function writeChangeReports(input: {
  outDir: string;
  stamp: string;
  dryRun: boolean;
  fieldChanges: FieldChange[];
  tagChanges: TagChange[];
  skipped: string[];
  stale: string[];
  counts: { table: string; n: string }[];
}): Promise<string[]> {
  const { outDir, stamp, dryRun, fieldChanges, tagChanges, skipped, stale, counts } = input;
  const suffix = dryRun ? "_dryrun" : "";
  const paths: string[] = [];

  paths.push(
    await writeCsvReport(
      outDir,
      `tag_changes_${stamp}${suffix}.csv`,
      ["cordis_id", "acronym", "kind", "tag_id", "tag_name", "action"],
      tagChanges as unknown as Record<string, unknown>[],
    ),
  );
  paths.push(
    await writeCsvReport(
      outDir,
      `field_changes_${stamp}${suffix}.csv`,
      ["table", "cordis_id", "label", "column", "before", "after"],
      fieldChanges as unknown as Record<string, unknown>[],
    ),
  );

  // Per-project rollup so the markdown stays readable at a few hundred changes.
  const byProject = new Map<string, { acronym: string; added: TagChange[]; removed: TagChange[] }>();
  for (const change of tagChanges) {
    const entry = byProject.get(change.cordis_id) ?? {
      acronym: change.acronym,
      added: [],
      removed: [],
    };
    if (change.action === "added") entry.added.push(change);
    else entry.removed.push(change);
    byProject.set(change.cordis_id, entry);
  }

  const label = (change: TagChange) => `${change.kind === "risk" ? "R" : "T"}:${change.tag_name}`;

  const md = [
    `# CORDIS refresh change log (${stamp})`,
    "",
    dryRun
      ? "**Dry run.** The transaction was rolled back; the database was not modified."
      : "**Committed.** These changes were applied to the database.",
    "",
    "## Row counts inside the transaction",
    "",
    markdownTable(
      ["table", "rows"],
      counts.map((row) => [row.table, row.n]),
    ),
    "",
    "## Climate risk and main theme tag changes",
    "",
    `Source of truth is the catalogue PDF export (\`project_climate_risks.csv\`, \`project_main_themes.csv\`),`,
    `replacing the previous keyword-derived tags. Added: ${tagChanges.filter((c) => c.action === "added").length}.`,
    `Removed: ${tagChanges.filter((c) => c.action === "removed").length}.`,
    "",
    markdownTable(
      ["cordis_id", "acronym", "added", "removed"],
      [...byProject.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([cordisId, entry]) => [
          cordisId,
          entry.acronym,
          entry.added.map(label).join(", ") || "-",
          entry.removed.map(label).join(", ") || "-",
        ]),
      "_no tag changes_",
    ),
    "",
    "## Field changes on rows that already existed",
    "",
    "Includes any values previously edited through /admin, since the loader treats CORDIS XML as the source of truth.",
    "",
    markdownTable(
      ["table", "cordis_id", "label", "column", "before", "after"],
      fieldChanges.map((change) => [
        change.table,
        change.cordis_id,
        truncate(change.label, 40),
        change.column,
        truncate(change.before, 60),
        truncate(change.after, 60),
      ]),
      "_no field changes_",
    ),
    "",
    "## Rows the previous batch loaded that this one no longer mentions",
    "",
    "The loader never deletes catalogue data. These are listed so removal stays a deliberate manual act.",
    "",
    stale.length === 0 ? "_none_" : stale.map((note) => `- ${note}`).join("\n"),
    "",
    "## Skipped or adjusted rows",
    "",
    skipped.length === 0 ? "_none_" : skipped.map((note) => `- ${note}`).join("\n"),
    "",
  ].join("\n");

  paths.push(await writeTextReport(outDir, `changes_${stamp}${suffix}.md`, md));
  return paths;
}

main().catch(async (error) => {
  console.error("Failed to load CORDIS CSVs:", error);
  await sql.end().catch(() => undefined);
  process.exit(1);
});
