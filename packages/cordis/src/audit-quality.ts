import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { sql } from "./config.js";
import { DEFAULT_AUDIT_DIR, DEFAULT_DOWNLOADS_DIR, getArgValue } from "./paths.js";
import { nowStamp, truncate, writeTextReport } from "./report.js";

// Port of farclimate/connected/dataProc/auditXmlSupabase.js.
// Read-only: CORDIS XML quality (missing shortName / VAT / web / keywords)
// plus load-fidelity checks against the hosted tables. Produces the same
// client-facing sample tables as the January 2026 report.
//
//   pnpm cordis:audit-quality
//   pnpm cordis:audit-quality -- --sampleSize=12

type XmlNode = Record<string, unknown>;

type XmlEntity = {
  id: string;
  vatNumber: string;
  shortName: string;
  addressUrl: string;
  addressCountry: string;
  legalName: string;
};

type XmlProject = {
  id: string;
  keywords: string;
  acronym: string;
  title: string;
  orgIds: Set<string>;
  file: string;
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

function toText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function hasText(value: unknown): boolean {
  return toText(value).length > 0;
}

function escapeMd(value: unknown): string {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .trim();
}

function sortNumericStrings(ids: string[]): string[] {
  return [...ids].sort((a, b) => Number(a) - Number(b));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

async function parseXmlCorpus(downloadsDir: string, files: string[]) {
  const projects = new Map<string, XmlProject>();
  const entities = new Map<string, XmlEntity>();
  const xmlProjectEntityPairs = new Set<string>();
  const entityToProjects = new Map<string, Set<string>>();
  const parseErrors: { file: string; error: string }[] = [];

  for (const file of files) {
    try {
      const xmlContent = await readFile(resolve(downloadsDir, file), "utf8");
      const projectData = (parser.parse(xmlContent) as { project?: XmlNode }).project;
      const projectId = toText(projectData?.id);
      if (!projectId) {
        parseErrors.push({ file, error: "Missing project.id" });
        continue;
      }

      const associations = (projectData?.relations as XmlNode | undefined)?.associations as
        | XmlNode
        | undefined;
      const organizations = toArray(associations?.organization);
      const orgIds = new Set<string>();

      for (const org of organizations) {
        const entityId = toText(org.id);
        if (!entityId) continue;
        orgIds.add(entityId);
        if (!entityToProjects.has(entityId)) entityToProjects.set(entityId, new Set());
        entityToProjects.get(entityId)?.add(projectId);

        const address = org.address as XmlNode | undefined;
        if (!entities.has(entityId)) {
          entities.set(entityId, {
            id: entityId,
            vatNumber: toText(org.vatNumber),
            shortName: toText(org.shortName),
            addressUrl: toText(address?.url),
            addressCountry: toText(address?.country),
            legalName: toText(org.legalName),
          });
        } else {
          const existing = entities.get(entityId)!;
          if (!hasText(existing.vatNumber) && hasText(org.vatNumber)) {
            existing.vatNumber = toText(org.vatNumber);
          }
          if (!hasText(existing.shortName) && hasText(org.shortName)) {
            existing.shortName = toText(org.shortName);
          }
          if (!hasText(existing.addressUrl) && hasText(address?.url)) {
            existing.addressUrl = toText(address?.url);
          }
          if (!hasText(existing.addressCountry) && hasText(address?.country)) {
            existing.addressCountry = toText(address?.country);
          }
          if (!hasText(existing.legalName) && hasText(org.legalName)) {
            existing.legalName = toText(org.legalName);
          }
        }

        xmlProjectEntityPairs.add(`${projectId}|${entityId}`);
      }

      projects.set(projectId, {
        id: projectId,
        keywords: toText(projectData?.keywords),
        acronym: toText(projectData?.acronym),
        title: toText(projectData?.title),
        orgIds,
        file,
      });
    } catch (error) {
      parseErrors.push({
        file,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { projects, entities, xmlProjectEntityPairs, entityToProjects, parseErrors };
}

async function main() {
  const downloadsDir = getArgValue("--downloadsDir") ?? DEFAULT_DOWNLOADS_DIR;
  const outDir = getArgValue("--outDir") ?? DEFAULT_AUDIT_DIR;
  const sampleSize = Number(getArgValue("--sampleSize") ?? 12);
  const stamp = nowStamp();

  const files = (await readdir(downloadsDir)).filter((file) => file.endsWith(".xml")).sort();
  const { projects, entities, xmlProjectEntityPairs, entityToProjects, parseErrors } =
    await parseXmlCorpus(downloadsDir, files);

  const entitiesArr = [...entities.values()];
  const projectsArr = [...projects.values()];

  const entitiesMissingShortName = entitiesArr.filter((e) => !hasText(e.shortName)).map((e) => e.id);
  const entitiesMissingVat = entitiesArr.filter((e) => !hasText(e.vatNumber)).map((e) => e.id);
  const entitiesMissingUrl = entitiesArr.filter((e) => !hasText(e.addressUrl)).map((e) => e.id);
  const entitiesMissingAllThree = entitiesArr
    .filter((e) => !hasText(e.shortName) && !hasText(e.vatNumber) && !hasText(e.addressUrl))
    .map((e) => e.id);
  const projectsMissingKeywordsInXml = projectsArr.filter((p) => !hasText(p.keywords)).map((p) => p.id);
  const xmlProjectsWithNoOrgs = projectsArr.filter((p) => p.orgIds.size === 0).map((p) => p.id);

  const dbEntities = await sql<
    {
      id: string;
      cordis_id: string;
      vat_number: string | null;
      short_name: string | null;
      address_url: string | null;
      legal_name: string | null;
    }[]
  >`
    SELECT id::text, cordis_id, vat_number, short_name, address_url, legal_name
    FROM public.entities_cordis
  `;
  const dbProjects = await sql<
    {
      id: string;
      cordis_id: string;
      keywords: string | null;
      title: string | null;
      acronym: string | null;
    }[]
  >`
    SELECT id::text, cordis_id, keywords, title, acronym FROM public.projects_cordis
  `;
  const dbProjectEntities = await sql<{ project_id: string; entity_id: string }[]>`
    SELECT project_id::text, entity_id::text FROM public.project_entities
  `;

  const dbEntityByCordisId = new Map(dbEntities.map((row) => [String(row.cordis_id), row]));
  const dbProjectByCordisId = new Map(dbProjects.map((row) => [String(row.cordis_id), row]));
  const dbProjectUuidToCordisId = new Map(dbProjects.map((row) => [String(row.id), String(row.cordis_id)]));
  const dbEntityUuidToCordisId = new Map(dbEntities.map((row) => [String(row.id), String(row.cordis_id)]));
  const dbProjectIdsWithEntities = new Set(dbProjectEntities.map((row) => String(row.project_id)));
  const dbEntityIdsWithProjects = new Set(dbProjectEntities.map((row) => String(row.entity_id)));

  const dbEntityCountByProjectCordisId = new Map<string, number>();
  for (const row of dbProjectEntities) {
    const projectCordisId = dbProjectUuidToCordisId.get(String(row.project_id));
    if (!projectCordisId) continue;
    dbEntityCountByProjectCordisId.set(
      projectCordisId,
      (dbEntityCountByProjectCordisId.get(projectCordisId) ?? 0) + 1,
    );
  }

  const xmlProjectIds = projectsArr.map((p) => p.id);
  const xmlEntityIds = entitiesArr.map((e) => e.id);
  const dbProjectCordisIds = dbProjects.map((p) => String(p.cordis_id));
  const dbEntityCordisIds = dbEntities.map((e) => String(e.cordis_id));
  const dbProjectCordisIdSet = new Set(dbProjectCordisIds);
  const dbEntityCordisIdSet = new Set(dbEntityCordisIds);
  const overlapProjectIds = xmlProjectIds.filter((id) => dbProjectCordisIdSet.has(id));
  const overlapEntityIds = xmlEntityIds.filter((id) => dbEntityCordisIdSet.has(id));

  const entityMismatch = {
    vat_present_in_xml_missing_in_db: [] as string[],
    short_present_in_xml_missing_in_db: [] as string[],
    url_present_in_xml_missing_in_db: [] as string[],
    vat_missing_in_xml_present_in_db: [] as string[],
    short_missing_in_xml_present_in_db: [] as string[],
    url_missing_in_xml_present_in_db: [] as string[],
    xml_entity_id_not_found_in_db: [] as string[],
  };

  for (const entity of entitiesArr) {
    const row = dbEntityByCordisId.get(entity.id);
    if (!row) {
      entityMismatch.xml_entity_id_not_found_in_db.push(entity.id);
      continue;
    }
    if (hasText(entity.vatNumber) && !hasText(row.vat_number)) {
      entityMismatch.vat_present_in_xml_missing_in_db.push(entity.id);
    }
    if (!hasText(entity.vatNumber) && hasText(row.vat_number)) {
      entityMismatch.vat_missing_in_xml_present_in_db.push(entity.id);
    }
    if (hasText(entity.shortName) && !hasText(row.short_name)) {
      entityMismatch.short_present_in_xml_missing_in_db.push(entity.id);
    }
    if (!hasText(entity.shortName) && hasText(row.short_name)) {
      entityMismatch.short_missing_in_xml_present_in_db.push(entity.id);
    }
    if (hasText(entity.addressUrl) && !hasText(row.address_url)) {
      entityMismatch.url_present_in_xml_missing_in_db.push(entity.id);
    }
    if (!hasText(entity.addressUrl) && hasText(row.address_url)) {
      entityMismatch.url_missing_in_xml_present_in_db.push(entity.id);
    }
  }

  const projectKeywordMismatch = {
    xml_missing_db_has: [] as string[],
    xml_missing_db_missing: [] as string[],
    xml_missing_db_row_missing: [] as string[],
  };
  for (const projectId of projectsMissingKeywordsInXml) {
    const row = dbProjectByCordisId.get(projectId);
    if (!row) {
      projectKeywordMismatch.xml_missing_db_row_missing.push(projectId);
      continue;
    }
    if (hasText(row.keywords)) projectKeywordMismatch.xml_missing_db_has.push(projectId);
    else projectKeywordMismatch.xml_missing_db_missing.push(projectId);
  }

  const dbProjectsEmptyKeywordsIds = dbProjects
    .filter((p) => !hasText(p.keywords))
    .map((p) => String(p.cordis_id))
    .sort();

  const dbProjectsNoEntitiesIds = dbProjects
    .filter((p) => !dbProjectIdsWithEntities.has(String(p.id)))
    .map((p) => String(p.cordis_id))
    .sort();

  const dbNoEntitiesButXmlHas: string[] = [];
  const dbNoEntitiesAndXmlAlsoNone: string[] = [];
  const dbNoEntitiesNotInXmlCorpus: string[] = [];
  for (const projectId of dbProjectsNoEntitiesIds) {
    const xmlProject = projects.get(projectId);
    if (!xmlProject) {
      dbNoEntitiesNotInXmlCorpus.push(projectId);
      continue;
    }
    if (xmlProject.orgIds.size > 0) dbNoEntitiesButXmlHas.push(projectId);
    else dbNoEntitiesAndXmlAlsoNone.push(projectId);
  }

  const dbEntitiesNoProjectsIds = dbEntities
    .filter((e) => !dbEntityIdsWithProjects.has(String(e.id)))
    .map((e) => String(e.cordis_id))
    .sort();

  const dbEntitiesNoProjectsButXmlHas: string[] = [];
  const dbEntitiesNoProjectsAndXmlAlsoNone: string[] = [];
  const dbEntitiesNoProjectsNotInXmlCorpus: string[] = [];
  for (const entityId of dbEntitiesNoProjectsIds) {
    if (!entities.has(entityId)) {
      dbEntitiesNoProjectsNotInXmlCorpus.push(entityId);
      continue;
    }
    const linked = entityToProjects.get(entityId) ?? new Set();
    if (linked.size > 0) dbEntitiesNoProjectsButXmlHas.push(entityId);
    else dbEntitiesNoProjectsAndXmlAlsoNone.push(entityId);
  }

  const entityById = new Map(entitiesArr.map((e) => [e.id, e]));

  const renderEntitySampleTable = (title: string, ids: string[]): string[] => {
    const sorted = sortNumericStrings(ids);
    const sample = sorted.slice(0, sampleSize);
    const lines = [
      `### ${title} (sample ${sample.length} of ${sorted.length})`,
      "",
      "| entity_cordis_id | legal_name | country | vat | short_name | web | projects_count | example_projects |",
      "|---:|---|:---:|---|---|---|---:|---|",
    ];
    for (const id of sample) {
      const xmlE = entityById.get(id);
      const dbE = dbEntityByCordisId.get(id);
      const projectSet = entityToProjects.get(id) ?? new Set();
      const exampleProjects = [...projectSet]
        .sort((a, b) => Number(a) - Number(b))
        .slice(0, 3)
        .join(", ");
      lines.push(
        `| ${escapeMd(id)} | ${truncate(xmlE?.legalName ?? dbE?.legal_name ?? "", 70)} | ${escapeMd(
          xmlE?.addressCountry ?? "",
        )} | ${escapeMd(xmlE?.vatNumber ?? "")} | ${escapeMd(xmlE?.shortName ?? "")} | ${escapeMd(
          xmlE?.addressUrl ?? "",
        )} | ${projectSet.size} | ${escapeMd(exampleProjects)} |`,
      );
    }
    lines.push("");
    return lines;
  };

  const renderProjectSampleTable = (title: string, ids: string[]): string[] => {
    const sorted = sortNumericStrings(ids);
    const sample = sorted.slice(0, sampleSize);
    const lines = [
      `### ${title} (sample ${sample.length} of ${sorted.length})`,
      "",
      "| project_cordis_id | acronym | title | xml_keywords | db_keywords | xml_orgs | db_entities |",
      "|---:|---|---|---|---|---:|---:|",
    ];
    for (const id of sample) {
      const xmlP = projects.get(id);
      const dbP = dbProjectByCordisId.get(id);
      lines.push(
        `| ${escapeMd(id)} | ${escapeMd(dbP?.acronym ?? xmlP?.acronym ?? "")} | ${truncate(
          dbP?.title ?? xmlP?.title ?? "",
          70,
        )} | ${escapeMd(xmlP?.keywords ?? "")} | ${escapeMd(dbP?.keywords ?? "")} | ${
          xmlP?.orgIds.size ?? 0
        } | ${dbEntityCountByProjectCordisId.get(id) ?? 0} |`,
      );
    }
    lines.push("");
    return lines;
  };

  const md = [
    `# XML vs Supabase audit (${stamp})`,
    "",
    `- XML folder: \`${downloadsDir}\``,
    `- XML files: **${files.length}**`,
    `- Parsed projects: **${projects.size}**`,
    `- Unique entities: **${entities.size}**`,
    `- Project-entity pairs: **${xmlProjectEntityPairs.size}**`,
    ...(parseErrors.length
      ? [`- Parse errors: **${parseErrors.length}** (see JSON for details)`]
      : []),
    "",
    "## Sanity checks (are we looking at the expected Supabase tables?)",
    `- Supabase row counts (API-visible): entities_cordis=**${dbEntities.length}**, projects_cordis=**${dbProjects.length}**, project_entities=**${dbProjectEntities.length}**`,
    `- ID shapes: XML projects numeric=**${xmlProjectIds.filter(isNumericId).length}**, Supabase projects UUID=**${dbProjects.map((p) => p.id).filter(isUuid).length}**, Supabase projects cordis_id numeric=**${dbProjectCordisIds.filter(isNumericId).length}**`,
    `- Overlap XML↔Supabase by cordis_id: projects=**${overlapProjectIds.length}**, entities=**${overlapEntityIds.length}**`,
    ...(overlapProjectIds.length !== projects.size || overlapEntityIds.length !== entities.size
      ? [
          "- WARNING: Some XML CORDIS ids were not found in Supabase by cordis_id. See JSON for exact missing lists.",
        ]
      : []),
    "",
    "## Samples (for client-facing discussion)",
    "",
    ...renderEntitySampleTable("Entities missing shortName in XML", entitiesMissingShortName),
    ...renderEntitySampleTable("Entities missing VAT in XML", entitiesMissingVat),
    ...renderEntitySampleTable("Entities missing web (address.url) in XML", entitiesMissingUrl),
    ...renderEntitySampleTable(
      "Entities missing shortName + VAT + web in XML",
      entitiesMissingAllThree,
    ),
    ...renderProjectSampleTable(
      "Projects missing keywords in XML (and DB)",
      projectsMissingKeywordsInXml,
    ),
    ...renderProjectSampleTable(
      "Projects with 0 associated entities in DB (project_entities), but orgs exist in XML",
      dbNoEntitiesButXmlHas,
    ),
    ...renderEntitySampleTable(
      "Entities with 0 associated projects in DB (project_entities), but projects exist in XML",
      dbEntitiesNoProjectsButXmlHas,
    ),
    "## 1) Entities missing Short Name / VAT / Web (source XML)",
    `- Missing shortName: **${entitiesMissingShortName.length}**`,
    `- Missing vatNumber: **${entitiesMissingVat.length}**`,
    `- Missing address.url: **${entitiesMissingUrl.length}**`,
    `- Missing all three: **${entitiesMissingAllThree.length}**`,
    "",
    "### Supabase mismatch highlights (should be ~0 for a clean load)",
    `- XML has VAT but DB missing: **${entityMismatch.vat_present_in_xml_missing_in_db.length}**`,
    `- XML has shortName but DB missing: **${entityMismatch.short_present_in_xml_missing_in_db.length}**`,
    `- XML has url but DB missing: **${entityMismatch.url_present_in_xml_missing_in_db.length}**`,
    `- XML entities not found in DB by id: **${entityMismatch.xml_entity_id_not_found_in_db.length}**`,
    "",
    "## 2) Projects without keywords (source XML) and in Supabase",
    `- Projects missing XML keywords: **${projectsMissingKeywordsInXml.length}**`,
    `- Of those, DB has keywords anyway: **${projectKeywordMismatch.xml_missing_db_has.length}**`,
    `- Of those, DB keywords also empty: **${projectKeywordMismatch.xml_missing_db_missing.length}**`,
    `- Of those, project row missing in DB: **${projectKeywordMismatch.xml_missing_db_row_missing.length}**`,
    "",
    `- DB projects with empty keywords (overall): **${dbProjectsEmptyKeywordsIds.length}**`,
    "",
    "## 3) Supabase projects with no associated entities (missing project_entities rows)",
    `- DB projects with zero project_entities rows: **${dbProjectsNoEntitiesIds.length}**`,
    `- DB missing relations but XML HAS orgs: **${dbNoEntitiesButXmlHas.length}**`,
    `- DB missing relations and XML also has no orgs: **${dbNoEntitiesAndXmlAlsoNone.length}**`,
    `- DB projects not in this XML corpus: **${dbNoEntitiesNotInXmlCorpus.length}**`,
    "",
    "## 4) Supabase entities with no associated projects (missing project_entities rows)",
    `- DB entities with zero project_entities rows: **${dbEntitiesNoProjectsIds.length}**`,
    `- DB missing relations but XML HAS projects: **${dbEntitiesNoProjectsButXmlHas.length}**`,
    `- DB missing relations and XML also has no projects: **${dbEntitiesNoProjectsAndXmlAlsoNone.length}**`,
    `- DB entities not in this XML corpus: **${dbEntitiesNoProjectsNotInXmlCorpus.length}**`,
    "",
    "---",
    "### Notes",
    "- This audit is read-only and does not write to the database.",
    "- Port of `farclimate/connected/dataProc/auditXmlSupabase.js`. Uses `DATABASE_URL` (bypasses RLS).",
    "- `pnpm cordis:audit` is the separate load-fidelity check (XML + PDF CSVs vs every pushed field).",
    "- Full ID lists and parse error details are in the JSON artifact.",
    "",
  ].join("\n");

  const json = {
    meta: {
      generatedAt: new Date().toISOString(),
      downloadsDir,
      xmlFileCount: files.length,
      readOnly: true,
      source: "packages/cordis/src/audit-quality.ts (port of auditXmlSupabase.js)",
    },
    xml: {
      parsedProjects: projects.size,
      uniqueEntities: entities.size,
      projectEntityPairs: xmlProjectEntityPairs.size,
      parseErrors,
    },
    sanity: {
      supabase_row_counts: {
        entities_cordis: dbEntities.length,
        projects_cordis: dbProjects.length,
        project_entities: dbProjectEntities.length,
      },
      id_shape: {
        xml_projects_numeric: xmlProjectIds.filter(isNumericId).length,
        xml_entities_numeric: xmlEntityIds.filter(isNumericId).length,
        supabase_projects_uuid: dbProjects.map((p) => p.id).filter(isUuid).length,
        supabase_entities_uuid: dbEntities.map((e) => e.id).filter(isUuid).length,
        supabase_projects_cordis_id_numeric: dbProjectCordisIds.filter(isNumericId).length,
        supabase_entities_cordis_id_numeric: dbEntityCordisIds.filter(isNumericId).length,
      },
      overlap_between_xml_and_supabase_ids: {
        projects: { count: overlapProjectIds.length, ids_sample: overlapProjectIds.slice(0, 20) },
        entities: { count: overlapEntityIds.length, ids_sample: overlapEntityIds.slice(0, 20) },
      },
    },
    checks: {
      entities_missing_fields_in_xml: {
        missing_short_name: { count: entitiesMissingShortName.length, ids: entitiesMissingShortName },
        missing_vat_number: { count: entitiesMissingVat.length, ids: entitiesMissingVat },
        missing_address_url: { count: entitiesMissingUrl.length, ids: entitiesMissingUrl },
        missing_all_three: { count: entitiesMissingAllThree.length, ids: entitiesMissingAllThree },
      },
      projects_missing_keywords_in_xml: {
        count: projectsMissingKeywordsInXml.length,
        ids: projectsMissingKeywordsInXml,
      },
      projects_with_no_organizations_in_xml: {
        count: xmlProjectsWithNoOrgs.length,
        ids: xmlProjectsWithNoOrgs,
      },
    },
    supabase: {
      entities_mismatch_xml_vs_db: {
        ...entityMismatch,
        counts: Object.fromEntries(
          Object.entries(entityMismatch).map(([key, value]) => [key, value.length]),
        ),
      },
      projects_keywords: {
        xml_missing_keywords_checked_in_db: {
          ...projectKeywordMismatch,
          counts: Object.fromEntries(
            Object.entries(projectKeywordMismatch).map(([key, value]) => [key, value.length]),
          ),
        },
        db_projects_with_empty_keywords: {
          count: dbProjectsEmptyKeywordsIds.length,
          ids: dbProjectsEmptyKeywordsIds,
        },
      },
      projects_without_project_entities: {
        count: dbProjectsNoEntitiesIds.length,
        ids: dbProjectsNoEntitiesIds,
        breakdown_vs_xml: {
          db_missing_relations_but_xml_has_orgs: {
            count: dbNoEntitiesButXmlHas.length,
            ids: dbNoEntitiesButXmlHas,
          },
          db_missing_relations_and_xml_has_no_orgs: {
            count: dbNoEntitiesAndXmlAlsoNone.length,
            ids: dbNoEntitiesAndXmlAlsoNone,
          },
          db_projects_not_in_xml_corpus: {
            count: dbNoEntitiesNotInXmlCorpus.length,
            ids: dbNoEntitiesNotInXmlCorpus,
          },
        },
      },
      entities_without_project_entities: {
        count: dbEntitiesNoProjectsIds.length,
        ids: dbEntitiesNoProjectsIds,
        breakdown_vs_xml: {
          db_missing_relations_but_xml_has_projects: {
            count: dbEntitiesNoProjectsButXmlHas.length,
            ids: dbEntitiesNoProjectsButXmlHas,
          },
          db_missing_relations_and_xml_has_no_projects: {
            count: dbEntitiesNoProjectsAndXmlAlsoNone.length,
            ids: dbEntitiesNoProjectsAndXmlAlsoNone,
          },
          db_entities_not_in_xml_corpus: {
            count: dbEntitiesNoProjectsNotInXmlCorpus.length,
            ids: dbEntitiesNoProjectsNotInXmlCorpus,
          },
        },
      },
    },
  };

  const mdPath = await writeTextReport(outDir, `quality_${stamp}.md`, md);
  const jsonPath = await writeTextReport(outDir, `quality_${stamp}.json`, JSON.stringify(json, null, 2));

  console.log("Quality audit completed (read-only).");
  console.log(`- Missing shortName: ${entitiesMissingShortName.length}`);
  console.log(`- Missing vatNumber: ${entitiesMissingVat.length}`);
  console.log(`- Missing address.url: ${entitiesMissingUrl.length}`);
  console.log(`- Missing all three: ${entitiesMissingAllThree.length}`);
  console.log(`- Projects missing keywords: ${projectsMissingKeywordsInXml.length}`);
  console.log(`- XML has field but DB missing (vat/short/url): ${
    entityMismatch.vat_present_in_xml_missing_in_db.length +
    entityMismatch.short_present_in_xml_missing_in_db.length +
    entityMismatch.url_present_in_xml_missing_in_db.length
  }`);
  console.log(`- MD:   ${mdPath}`);
  console.log(`- JSON: ${jsonPath}`);
  await sql.end();
}

main().catch(async (error) => {
  console.error("Quality audit failed:", error);
  await sql.end().catch(() => undefined);
  process.exit(1);
});
