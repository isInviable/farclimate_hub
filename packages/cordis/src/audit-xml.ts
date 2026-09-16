import { readdir, readFile } from "node:fs/promises";
import { sql } from "./config.js";
import {
  DEFAULT_AUDIT_DIR,
  DEFAULT_DOWNLOADS_DIR,
  DEFAULT_RISKS_CSV_PATH,
  DEFAULT_SOURCES_PATH,
  DEFAULT_THEMES_CSV_PATH,
  getArgValue,
} from "./paths.js";
import { parseCordisXmlDirectory } from "./parse-xml.js";
import { markdownTable, nowStamp, truncate, writeTextReport } from "./report.js";

// Read-only verification that the database matches the XML corpus and the
// catalogue category CSVs. Runs the same parser as `cordis:push`, so a clean
// audit means the loader has nothing left to do.

type Problem = {
  check: string;
  subject: string;
  detail: string;
};

function normalise(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

async function main() {
  const downloadsDir = getArgValue("--downloadsDir") ?? DEFAULT_DOWNLOADS_DIR;
  const outDir = getArgValue("--outDir") ?? DEFAULT_AUDIT_DIR;
  const sourcesPath = getArgValue("--sources") ?? DEFAULT_SOURCES_PATH;
  const risksCsvPath = getArgValue("--risksCsv") ?? DEFAULT_RISKS_CSV_PATH;
  const themesCsvPath = getArgValue("--themesCsv") ?? DEFAULT_THEMES_CSV_PATH;
  const stamp = nowStamp();
  const problems: Problem[] = [];

  // ---- sources.csv vs downloaded XML -------------------------------------
  const sourcesRaw = await readFile(sourcesPath, "utf8");
  const sourceIds = [...new Set([...sourcesRaw.matchAll(/project\/id\/(\d+)/g)].map((m) => m[1]))];
  const xmlFiles = (await readdir(downloadsDir)).filter((file) => file.endsWith(".xml")).sort();
  const downloadedIds = new Set(xmlFiles.map((file) => file.replace(/\.xml$/, "")));

  for (const id of sourceIds) {
    if (downloadedIds.has(id)) continue;
    problems.push({
      check: "sources vs downloads",
      subject: id,
      detail: "Listed in sources.csv but no XML file was downloaded.",
    });
  }
  for (const id of downloadedIds) {
    if (sourceIds.includes(id)) continue;
    problems.push({
      check: "sources vs downloads",
      subject: id,
      detail: "XML file present but the project is not in sources.csv (left over from an older batch).",
    });
  }

  // ---- parse exactly what the loader would push --------------------------
  const parsed = await parseCordisXmlDirectory(downloadsDir, { risksCsvPath, themesCsvPath });
  for (const warning of parsed.warnings) {
    problems.push({ check: "parser warning", subject: "-", detail: warning });
  }

  // ---- database side -----------------------------------------------------
  const dbProjects = await sql<
    {
      id: string;
      cordis_id: string;
      acronym: string | null;
      title: string | null;
      teaser: string | null;
      keywords: string | null;
      total_cost: number | null;
      ec_max_contribution: number | null;
      start_date: string | null;
      end_date: string | null;
      duration: number | null;
    }[]
  >`
    SELECT id::text, cordis_id, acronym, title, teaser, keywords,
           total_cost, ec_max_contribution, start_date, end_date, duration
    FROM public.projects_cordis
  `;
  const dbEntities = await sql<
    { id: string; cordis_id: string; short_name: string | null; legal_name: string | null }[]
  >`
    SELECT id::text, cordis_id, short_name, legal_name FROM public.entities_cordis
  `;
  const dbProjectEntities = await sql<{ project_id: string; entity_id: string }[]>`
    SELECT project_id::text, entity_id::text FROM public.project_entities
  `;
  const dbRisks = await sql<{ project_id: string; risk_id: number }[]>`
    SELECT project_id::text, risk_id FROM public.project_risks
  `;
  const dbThemes = await sql<{ project_id: string; theme_id: number }[]>`
    SELECT project_id::text, theme_id FROM public.project_themes
  `;
  const dbProducts = await sql<
    { cordis_id: string; product_category_id: number | null; title: string | null }[]
  >`
    SELECT pc.cordis_id, p.product_category_id, pc.title
    FROM public.products_cordis pc
    JOIN public.products p ON p.id = pc.product_id
  `;
  const dbProductProjects = await sql<{ product_cordis_id: string; project_cordis_id: string }[]>`
    SELECT pc.cordis_id AS product_cordis_id, pr.cordis_id AS project_cordis_id
    FROM public.product_projects pp
    JOIN public.products_cordis pc ON pc.product_id = pp.product_id
    JOIN public.projects_cordis pr ON pr.id = pp.project_id
  `;
  const dbOrphans = await sql<{ check: string; n: string }[]>`
    SELECT 'products without a project' AS check, count(*)::text AS n
    FROM public.products p
    WHERE p.type = 'cordis'
      AND NOT EXISTS (SELECT 1 FROM public.product_projects pp WHERE pp.product_id = p.id)
    UNION ALL
    SELECT 'projects without entities', count(*)::text
    FROM public.projects_cordis pr
    WHERE NOT EXISTS (SELECT 1 FROM public.project_entities pe WHERE pe.project_id = pr.id)
    UNION ALL
    SELECT 'projects without risks', count(*)::text
    FROM public.projects_cordis pr
    WHERE NOT EXISTS (SELECT 1 FROM public.project_risks x WHERE x.project_id = pr.id)
    UNION ALL
    SELECT 'projects without themes', count(*)::text
    FROM public.projects_cordis pr
    WHERE NOT EXISTS (SELECT 1 FROM public.project_themes x WHERE x.project_id = pr.id)
    UNION ALL
    SELECT 'cordis products with no products_cordis detail', count(*)::text
    FROM public.products p
    WHERE p.type = 'cordis'
      AND NOT EXISTS (SELECT 1 FROM public.products_cordis pc WHERE pc.product_id = p.id)
  `;

  const dbProjectByCordis = new Map(dbProjects.map((row) => [row.cordis_id, row]));
  const dbEntityByCordis = new Map(dbEntities.map((row) => [row.cordis_id, row]));
  const cordisByProjectUuid = new Map(dbProjects.map((row) => [row.id, row.cordis_id]));
  const cordisByEntityUuid = new Map(dbEntities.map((row) => [row.id, row.cordis_id]));

  // ---- projects: presence and field-level equality -----------------------
  const PROJECT_FIELDS: {
    csv: keyof (typeof parsed.projects)[number];
    db: keyof (typeof dbProjects)[number];
  }[] = [
    { csv: "acronym", db: "acronym" },
    { csv: "title", db: "title" },
    { csv: "teaser", db: "teaser" },
    { csv: "keywords", db: "keywords" },
    { csv: "totalCost", db: "total_cost" },
    { csv: "ecMaxContribution", db: "ec_max_contribution" },
    { csv: "startDate", db: "start_date" },
    { csv: "endDate", db: "end_date" },
    { csv: "duration", db: "duration" },
  ];

  for (const project of parsed.projects) {
    const dbRow = dbProjectByCordis.get(project.id);
    if (!dbRow) {
      problems.push({
        check: "project missing",
        subject: `${project.id} (${project.acronym})`,
        detail: "In the XML corpus but not in projects_cordis.",
      });
      continue;
    }
    for (const field of PROJECT_FIELDS) {
      const expected = normalise(project[field.csv]);
      const actual = normalise(dbRow[field.db]);
      if (expected === actual) continue;
      problems.push({
        check: "project field differs",
        subject: `${project.id}.${String(field.db)}`,
        detail: `XML "${truncate(expected, 60)}" vs database "${truncate(actual, 60)}"`,
      });
    }
  }

  // ---- entities and project-entity links --------------------------------
  for (const entity of parsed.entities) {
    if (dbEntityByCordis.has(entity.id)) continue;
    problems.push({
      check: "entity missing",
      subject: `${entity.id} (${entity.shortName || entity.legalName})`,
      detail: "In the XML corpus but not in entities_cordis.",
    });
  }

  const dbPairs = new Set(
    dbProjectEntities.flatMap((row) => {
      const projectCordis = cordisByProjectUuid.get(row.project_id);
      const entityCordis = cordisByEntityUuid.get(row.entity_id);
      return projectCordis && entityCordis ? [`${projectCordis}|${entityCordis}`] : [];
    }),
  );
  const xmlPairs = new Set(
    parsed.projectEntities.map((row) => `${row.projectId}|${row.entityId}`),
  );
  for (const pair of xmlPairs) {
    if (dbPairs.has(pair)) continue;
    problems.push({
      check: "project-entity link missing",
      subject: pair.replace("|", " / "),
      detail: "Present in the XML corpus but not in project_entities.",
    });
  }
  for (const pair of dbPairs) {
    if (xmlPairs.has(pair)) continue;
    problems.push({
      check: "project-entity link extra",
      subject: pair.replace("|", " / "),
      detail: "In project_entities but not in the current XML corpus.",
    });
  }

  // ---- risks and themes against the catalogue CSVs ----------------------
  const compareTags = (
    kind: "risk" | "theme",
    expected: { projectId: string; tagId: number }[],
    actual: { project_id: string; tagId: number }[],
  ) => {
    const expectedSet = new Set(expected.map((row) => `${row.projectId}|${row.tagId}`));
    const actualSet = new Set(
      actual.flatMap((row) => {
        const cordisId = cordisByProjectUuid.get(row.project_id);
        return cordisId ? [`${cordisId}|${row.tagId}`] : [];
      }),
    );
    for (const key of expectedSet) {
      if (actualSet.has(key)) continue;
      problems.push({
        check: `${kind} tag missing`,
        subject: key.replace("|", " / "),
        detail: `Assigned by the catalogue CSV but absent from project_${kind}s.`,
      });
    }
    for (const key of actualSet) {
      if (expectedSet.has(key)) continue;
      problems.push({
        check: `${kind} tag extra`,
        subject: key.replace("|", " / "),
        detail: `In project_${kind}s but not assigned by the catalogue CSV.`,
      });
    }
  };

  compareTags(
    "risk",
    parsed.projectRisks.map((row) => ({ projectId: row.projectId, tagId: row.riskId })),
    dbRisks.map((row) => ({ project_id: row.project_id, tagId: row.risk_id })),
  );
  compareTags(
    "theme",
    parsed.projectThemes.map((row) => ({ projectId: row.projectId, tagId: row.themeId })),
    dbThemes.map((row) => ({ project_id: row.project_id, tagId: row.theme_id })),
  );

  // ---- products ---------------------------------------------------------
  const dbProductByCordis = new Map(dbProducts.map((row) => [row.cordis_id, row]));
  for (const product of parsed.products) {
    const dbRow = dbProductByCordis.get(product.id);
    if (!dbRow) {
      problems.push({
        check: "product missing",
        subject: `${product.id} (${truncate(product.title, 50)})`,
        detail: "In the XML corpus but not in products_cordis.",
      });
      continue;
    }
    if (normalise(dbRow.product_category_id) !== normalise(product.productCategoryId)) {
      problems.push({
        check: "product category differs",
        subject: product.id,
        detail: `expected ${product.productCategoryId}, database has ${dbRow.product_category_id ?? "null"}`,
      });
    }
  }

  const dbProductLinks = new Set(
    dbProductProjects.map((row) => `${row.product_cordis_id}|${row.project_cordis_id}`),
  );
  for (const product of parsed.products) {
    const key = `${product.id}|${product.projectId}`;
    if (dbProductLinks.has(key)) continue;
    problems.push({
      check: "product-project link missing",
      subject: key.replace("|", " / "),
      detail: "Present in the XML corpus but not in product_projects.",
    });
  }

  // ---- render -----------------------------------------------------------
  const byCheck = new Map<string, Problem[]>();
  for (const problem of problems) {
    const list = byCheck.get(problem.check) ?? [];
    list.push(problem);
    byCheck.set(problem.check, list);
  }

  const MAX_ROWS_PER_CHECK = 25;
  const md = [
    `# CORDIS XML vs database audit (${stamp})`,
    "",
    "Read-only. Uses the same parser and the same catalogue CSVs as `cordis:push`,",
    "so an audit with no problems means the loader has nothing left to apply.",
    "",
    "## Corpus",
    "",
    markdownTable(
      ["input", "count"],
      [
        ["projects in sources.csv", sourceIds.length],
        ["XML files downloaded", xmlFiles.length],
        ["projects parsed", parsed.projects.length],
        ["unique entities", parsed.entities.length],
        ["project-entity pairs", parsed.projectEntities.length],
        ["risk tags (catalogue CSV)", parsed.projectRisks.length],
        ["theme tags (catalogue CSV)", parsed.projectThemes.length],
        ["publications", parsed.products.length],
      ],
    ),
    "",
    "## Database",
    "",
    markdownTable(
      ["table", "rows"],
      [
        ["projects_cordis", dbProjects.length],
        ["entities_cordis", dbEntities.length],
        ["project_entities", dbProjectEntities.length],
        ["project_risks", dbRisks.length],
        ["project_themes", dbThemes.length],
        ["products_cordis", dbProducts.length],
        ["product_projects", dbProductProjects.length],
      ],
    ),
    "",
    "## Referential checks",
    "",
    markdownTable(
      ["check", "rows"],
      dbOrphans.map((row) => [row.check, row.n]),
    ),
    "",
    `## Problems (${problems.length})`,
    "",
    problems.length === 0
      ? "**None.** The database matches the XML corpus and the catalogue CSVs."
      : [...byCheck.entries()]
          .map(([check, list]) =>
            [
              `### ${check} (${list.length})`,
              "",
              markdownTable(
                ["subject", "detail"],
                list.slice(0, MAX_ROWS_PER_CHECK).map((p) => [p.subject, p.detail]),
              ),
              list.length > MAX_ROWS_PER_CHECK
                ? `\n_...and ${list.length - MAX_ROWS_PER_CHECK} more; see the JSON report._`
                : "",
            ].join("\n"),
          )
          .join("\n\n"),
    "",
  ].join("\n");

  const json = {
    meta: { generatedAt: new Date().toISOString(), downloadsDir, readOnly: true },
    corpus: {
      sourceProjects: sourceIds.length,
      xmlFiles: xmlFiles.length,
      projects: parsed.projects.length,
      entities: parsed.entities.length,
      projectEntities: parsed.projectEntities.length,
      projectRisks: parsed.projectRisks.length,
      projectThemes: parsed.projectThemes.length,
      products: parsed.products.length,
      unmappedProductTypeCodes: Object.fromEntries(parsed.unmappedProductTypeCodes),
    },
    database: {
      projects_cordis: dbProjects.length,
      entities_cordis: dbEntities.length,
      project_entities: dbProjectEntities.length,
      project_risks: dbRisks.length,
      project_themes: dbThemes.length,
      products_cordis: dbProducts.length,
      product_projects: dbProductProjects.length,
      referential: Object.fromEntries(dbOrphans.map((row) => [row.check, Number(row.n)])),
    },
    problemCount: problems.length,
    problemsByCheck: Object.fromEntries(
      [...byCheck.entries()].map(([check, list]) => [check, list.length]),
    ),
    problems,
  };

  const mdPath = await writeTextReport(outDir, `audit_${stamp}.md`, md);
  const jsonPath = await writeTextReport(
    outDir,
    `audit_${stamp}.json`,
    JSON.stringify(json, null, 2),
  );

  console.log(`Audit completed (read-only). Problems: ${problems.length}`);
  for (const [check, list] of byCheck) {
    console.log(`  ${check}: ${list.length}`);
  }
  console.log(`- MD:   ${mdPath}\n- JSON: ${jsonPath}`);
  await sql.end();
}

main().catch(async (error) => {
  console.error("Audit failed:", error);
  await sql.end().catch(() => undefined);
  process.exit(1);
});
