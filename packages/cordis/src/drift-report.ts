import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { sql } from "./config.js";
import {
  DEFAULT_AUDIT_DIR,
  DEFAULT_DOWNLOADS_DIR,
  DEFAULT_SOURCES_PATH,
  getArgValue,
} from "./paths.js";
import { markdownTable, nowStamp, truncate, writeTextReport } from "./report.js";
import { normaliseType, readExpectedPolicies, readExpectedSchema } from "./schema-expectation.js";
import {
  ENTITY_TYPES,
  PRODUCT_TYPE_LOOKUP,
  PRODUCT_TYPES,
  RISKS,
  THEMES,
} from "./taxonomy.js";

// Read-only comparison of the hosted database against the SQL and taxonomy this
// package owns. Manual edits made in the Supabase console show up here so they
// can be confirmed and folded back into the scripts before any refresh.

const CORDIS_TABLES = [
  "aux_climate_risks",
  "aux_themes",
  "aux_entity_types",
  "aux_product_categories",
  "projects_cordis",
  "entities_cordis",
  "project_entities",
  "project_risks",
  "project_themes",
  "products",
  "products_cordis",
  "products_custom",
  "product_projects",
];

type Severity = "BLOCKS_PUSH" | "LIVE_IS_BETTER" | "REPO_IS_BETTER" | "INFO";

type Finding = {
  severity: Severity;
  area: string;
  subject: string;
  detail: string;
  action: string;
};

const SEVERITY_ORDER: Severity[] = ["BLOCKS_PUSH", "LIVE_IS_BETTER", "REPO_IS_BETTER", "INFO"];

/**
 * Collapses findings that repeat verbatim across tables into one row listing the
 * affected subjects, so a schema-wide difference reads as one decision rather
 * than thirteen.
 */
function groupFindings(findings: Finding[]): Finding[] {
  const buckets = new Map<string, Finding[]>();
  const order: string[] = [];
  for (const finding of findings) {
    const key = `${finding.severity}|${finding.area}|${finding.detail}|${finding.action}`;
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)?.push(finding);
  }

  return order.flatMap((key) => {
    const bucket = buckets.get(key) ?? [];
    if (bucket.length < 3) return bucket;
    return [
      {
        ...bucket[0],
        subject: `${bucket.length} tables: ${bucket.map((finding) => finding.subject).join(", ")}`,
      },
    ];
  });
}

const SEVERITY_BLURB: Record<Severity, string> = {
  BLOCKS_PUSH: "Would fail or corrupt `cordis:push`. Fix before loading.",
  LIVE_IS_BETTER:
    "A manual improvement that exists only in the database. Confirm, then back-port it into `sql/` or `taxonomy.ts`.",
  REPO_IS_BETTER:
    "The repo defines something the database lacks. Decide whether to apply it, and remember `cordis:create` is not run against hosted.",
  INFO: "Cosmetic or already-accepted difference. No action needed.",
};

function normaliseDefault(value: string | null): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/::[a-z ]+$/, "")
    .replace(/\s+/g, " ");
}

async function collectUnmappedProductCodes(downloadsDir: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    removeNSPrefix: true,
    trimValues: true,
  });
  const toArray = (value: unknown) =>
    !value ? [] : Array.isArray(value) ? value : [value as Record<string, unknown>];

  const counts = new Map<string, number>();
  let files: string[] = [];
  try {
    files = (await readdir(downloadsDir)).filter((file) => file.endsWith(".xml"));
  } catch {
    return { counts, files: 0 };
  }

  for (const file of files) {
    const xml = await readFile(resolve(downloadsDir, file), "utf8");
    const project = (parser.parse(xml) as { project?: Record<string, unknown> }).project;
    const associations = (project?.relations as Record<string, unknown> | undefined)
      ?.associations as Record<string, unknown> | undefined;

    for (const result of toArray(associations?.result)) {
      const categories = toArray(
        (
          (result.relations as Record<string, unknown> | undefined)?.categories as
            | Record<string, unknown>
            | undefined
        )?.category,
      );
      if (!categories.some((category) => category.code === "publication")) continue;

      const typeCategory = categories.find(
        (category) => String(category.classification ?? "").toLowerCase() === "projectpublication",
      );
      const code = String(typeCategory?.code ?? "").toUpperCase();
      const key = code || "(no type code)";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return { counts, files: files.length };
}

async function main() {
  const outDir = getArgValue("--outDir") ?? DEFAULT_AUDIT_DIR;
  const downloadsDir = getArgValue("--downloadsDir") ?? DEFAULT_DOWNLOADS_DIR;
  const sourcesPath = getArgValue("--sources") ?? DEFAULT_SOURCES_PATH;
  const stamp = nowStamp();
  const findings: Finding[] = [];

  const { tables: expectedTables, unparsed } = readExpectedSchema();
  const expectedPolicies = readExpectedPolicies();
  for (const line of unparsed) {
    findings.push({
      severity: "INFO",
      area: "ddl parser",
      subject: line,
      detail: "Line in sql/01_tables.sql that the drift reader could not classify.",
      action: "Check by hand; the drift report may be incomplete for it.",
    });
  }

  // ---- live introspection -------------------------------------------------
  const liveColumns = await sql<
    {
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }[]
  >`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ${sql(CORDIS_TABLES)}
    ORDER BY table_name, ordinal_position
  `;

  const liveConstraints = await sql<{ tbl: string; conname: string; def: string }[]>`
    SELECT conrelid::regclass::text AS tbl, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND conrelid::regclass::text IN ${sql(CORDIS_TABLES)}
    ORDER BY tbl, conname
  `;

  const liveIndexes = await sql<{ tablename: string; indexname: string; indexdef: string }[]>`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename IN ${sql(CORDIS_TABLES)}
    ORDER BY tablename, indexname
  `;

  const livePolicies = await sql<
    {
      tablename: string;
      policyname: string;
      cmd: string;
      permissive: string;
      roles: string;
      qual: string | null;
      with_check: string | null;
    }[]
  >`
    SELECT tablename, policyname, cmd, permissive, roles::text AS roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ${sql(CORDIS_TABLES)}
    ORDER BY tablename, cmd, policyname
  `;

  const liveRls = await sql<{ tablename: string; rls: boolean }[]>`
    SELECT c.relname AS tablename, c.relrowsecurity AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ${sql(CORDIS_TABLES)}
  `;

  const liveTriggers = await sql<{ tbl: string; tgname: string; def: string }[]>`
    SELECT c.relname AS tbl, t.tgname, pg_get_triggerdef(t.oid) AS def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT t.tgisinternal AND c.relname IN ${sql(CORDIS_TABLES)}
  `;

  const liveComments = await sql<{ tbl: string; col: string | null; comment: string }[]>`
    SELECT c.relname AS tbl,
           a.attname AS col,
           COALESCE(col_description(c.oid, a.attnum), obj_description(c.oid, 'pg_class')) AS comment
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relname IN ${sql(CORDIS_TABLES)}
      AND COALESCE(col_description(c.oid, a.attnum), obj_description(c.oid, 'pg_class')) IS NOT NULL
  `;

  const liveGrants = await sql<{ grantee: string; table_name: string; privs: string }[]>`
    SELECT grantee, table_name, string_agg(DISTINCT privilege_type, ',' ORDER BY privilege_type) AS privs
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name IN ${sql(CORDIS_TABLES)}
      AND grantee IN ('anon', 'authenticated')
    GROUP BY grantee, table_name
    ORDER BY table_name, grantee
  `;

  const liveAuxRisks = await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM public.aux_climate_risks ORDER BY id
  `;
  const liveAuxThemes = await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM public.aux_themes ORDER BY id
  `;
  const liveAuxProductCategories = await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM public.aux_product_categories ORDER BY id
  `;
  const liveAuxEntityTypes = await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM public.aux_entity_types ORDER BY id
  `;
  const liveProjects = await sql<{ cordis_id: string; acronym: string | null }[]>`
    SELECT cordis_id, acronym FROM public.projects_cordis ORDER BY cordis_id
  `;
  const liveProductCategoryByCode = await sql<
    { type_code: string | null; product_category_id: number | null; n: string }[]
  >`
    SELECT pc.type_code, p.product_category_id, count(*)::text AS n
    FROM public.products_cordis pc
    JOIN public.products p ON p.id = pc.product_id
    GROUP BY pc.type_code, p.product_category_id
    ORDER BY pc.type_code
  `;

  // ---- columns ------------------------------------------------------------
  type LiveColumn = (typeof liveColumns)[number];
  const liveColumnsByTable = new Map<string, LiveColumn[]>();
  for (const column of liveColumns) {
    const list = liveColumnsByTable.get(column.table_name) ?? [];
    list.push(column);
    liveColumnsByTable.set(column.table_name, list);
  }

  for (const [tableName, expected] of expectedTables) {
    const live = liveColumnsByTable.get(tableName);
    if (!live) {
      findings.push({
        severity: "REPO_IS_BETTER",
        area: "table",
        subject: tableName,
        detail: "Defined in sql/01_tables.sql but absent from the database.",
        action: "Create it before pushing, or drop it from the DDL.",
      });
      continue;
    }

    const liveByName = new Map(live.map((column) => [column.column_name, column]));

    for (const column of expected.columns) {
      const liveColumn = liveByName.get(column.name);
      if (!liveColumn) {
        findings.push({
          severity: "BLOCKS_PUSH",
          area: "column",
          subject: `${tableName}.${column.name}`,
          detail: "In the DDL but not in the database; the loader would fail on it.",
          action: "Add the column to the database or remove it from the DDL and the loader.",
        });
        continue;
      }

      if (normaliseType(liveColumn.data_type) !== column.type) {
        findings.push({
          severity: "BLOCKS_PUSH",
          area: "column type",
          subject: `${tableName}.${column.name}`,
          detail: `database "${liveColumn.data_type}" vs DDL "${column.type}"`,
          action: "Reconcile the types before pushing.",
        });
      }

      const liveNotNull = liveColumn.is_nullable === "NO";
      if (liveNotNull && !column.notNull) {
        findings.push({
          severity: "LIVE_IS_BETTER",
          area: "nullability",
          subject: `${tableName}.${column.name}`,
          detail: "NOT NULL in the database, nullable in the DDL.",
          action: "Add `not null` to sql/01_tables.sql and make sure the loader never sends null.",
        });
      } else if (!liveNotNull && column.notNull) {
        findings.push({
          severity: "INFO",
          area: "nullability",
          subject: `${tableName}.${column.name}`,
          detail: "NOT NULL in the DDL, nullable in the database.",
          action: "The DDL is stricter; harmless for pushes into the existing table.",
        });
      }

      // serial expands to an implicit nextval() default, so the two agree.
      const defaultMatches = column.autoIncrement
        ? /^nextval\(/i.test(liveColumn.column_default ?? "")
        : normaliseDefault(liveColumn.column_default) === normaliseDefault(column.default);
      if (!defaultMatches) {
        findings.push({
          severity: "INFO",
          area: "default",
          subject: `${tableName}.${column.name}`,
          detail: `database "${liveColumn.column_default ?? "none"}" vs DDL "${column.default ?? "none"}"`,
          action: "Align if it matters for rebuilds.",
        });
      }
    }

    const expectedNames = new Set(expected.columns.map((column) => column.name));
    for (const column of live) {
      if (expectedNames.has(column.column_name)) continue;
      findings.push({
        severity: "LIVE_IS_BETTER",
        area: "column",
        subject: `${tableName}.${column.column_name}`,
        detail: `Added manually (${column.data_type}, ${column.is_nullable === "NO" ? "NOT NULL" : "nullable"}).`,
        action: "Confirm, then add it to sql/01_tables.sql and to the loader if it should be populated.",
      });
    }
  }

  for (const tableName of liveColumnsByTable.keys()) {
    if (expectedTables.has(tableName)) continue;
    findings.push({
      severity: "LIVE_IS_BETTER",
      area: "table",
      subject: tableName,
      detail: "Exists in the database but not in sql/01_tables.sql.",
      action: "Confirm, then add it to the DDL.",
    });
  }

  // ---- indexes ------------------------------------------------------------
  const liveIndexByTable = new Map<string, Set<string>>();
  for (const index of liveIndexes) {
    const set = liveIndexByTable.get(index.tablename) ?? new Set<string>();
    set.add(index.indexname);
    liveIndexByTable.set(index.tablename, set);
  }
  for (const [tableName, expected] of expectedTables) {
    const live = liveIndexByTable.get(tableName) ?? new Set<string>();
    for (const index of expected.indexes) {
      const name = index.split(" ")[0];
      if (live.has(name)) continue;
      findings.push({
        severity: "REPO_IS_BETTER",
        area: "index",
        subject: `${tableName}.${name}`,
        detail: `Declared in the DDL as ${index} but missing from the database.`,
        action: "Create it manually if you want it; `cordis:create` is not run against hosted.",
      });
    }
  }

  // Foreign keys without a supporting index make the loader's per-project
  // deletes and the Hub's joins do sequential scans.
  for (const constraint of liveConstraints) {
    const fk = constraint.def.match(/^FOREIGN KEY \(([a-z0-9_, ]+)\)/i);
    if (!fk) continue;
    const columns = fk[1].split(",").map((column) => column.trim());
    const indexes = liveIndexes.filter((index) => index.tablename === constraint.tbl);
    const covered = indexes.some((index) => {
      const columnList = index.indexdef.match(/\(([^)]*)\)/)?.[1] ?? "";
      const indexColumns = columnList.split(",").map((column) => column.trim().replace(/"/g, ""));
      return columns.every((column, position) => indexColumns[position] === column);
    });
    if (covered) continue;
    findings.push({
      severity: "INFO",
      area: "index",
      subject: `${constraint.tbl} (${columns.join(", ")})`,
      detail: "Foreign key with no leading index in the database or the DDL.",
      action: "Consider `create index if not exists` in sql/01_tables.sql.",
    });
  }

  // ---- constraints --------------------------------------------------------
  const constraintsByTable = new Map<string, string[]>();
  for (const constraint of liveConstraints) {
    const list = constraintsByTable.get(constraint.tbl) ?? [];
    list.push(`${constraint.conname}: ${constraint.def}`);
    constraintsByTable.set(constraint.tbl, list);
  }
  for (const [tableName, list] of constraintsByTable) {
    const seen = new Map<string, string[]>();
    for (const entry of list) {
      const def = entry.slice(entry.indexOf(": ") + 2);
      const names = seen.get(def) ?? [];
      names.push(entry.slice(0, entry.indexOf(": ")));
      seen.set(def, names);
    }
    for (const [def, names] of seen) {
      if (names.length < 2) continue;
      findings.push({
        severity: "INFO",
        area: "constraint",
        subject: `${tableName}: ${def}`,
        detail: `Duplicated across ${names.length} constraints: ${names.join(", ")}.`,
        action: "Optionally drop the redundant one.",
      });
    }
  }

  // ---- RLS ----------------------------------------------------------------
  for (const row of liveRls) {
    if (row.rls) continue;
    findings.push({
      severity: "BLOCKS_PUSH",
      area: "rls",
      subject: row.tablename,
      detail: "Row level security is disabled, so the table is world-writable through the API.",
      action: "Enable RLS.",
    });
  }

  // Policies are near-identical across the thirteen tables, so describe each
  // family once per table and let the grouping pass collapse them.
  const expectedPolicyNames = new Set(
    expectedPolicies.map((policy) => `${policy.table}|${policy.name}`),
  );
  type LivePolicy = (typeof livePolicies)[number];
  const livePoliciesByTable = new Map<string, LivePolicy[]>();
  for (const policy of livePolicies) {
    const list = livePoliciesByTable.get(policy.tablename) ?? [];
    list.push(policy);
    livePoliciesByTable.set(policy.tablename, list);
  }

  for (const [tableName, policies] of livePoliciesByTable) {
    const permissiveWrites = policies.filter((policy) => {
      if (!["INSERT", "UPDATE", "DELETE", "ALL"].includes(policy.cmd)) return false;
      return !/connected_admin/i.test(`${policy.qual ?? ""} ${policy.with_check ?? ""}`);
    });
    if (permissiveWrites.length > 0) {
      const expressions = [
        ...new Set(
          permissiveWrites.map((policy) =>
            `${policy.qual ?? policy.with_check ?? ""}`.trim(),
          ),
        ),
      ];
      findings.push({
        severity: "REPO_IS_BETTER",
        area: "rls write policy",
        subject: tableName,
        detail:
          `${permissiveWrites.map((policy) => `"${policy.policyname}"`).join(", ")} allow writes on ` +
          `\`${expressions.join(" / ")}\`, so any authenticated user can edit the catalogue. ` +
          "sql/02_rls.sql restricts writes to connected_admin but was never applied.",
        action:
          "Deferred follow-up: confirm the admin JWT carries the connected_admin claim, then drop these and apply the repo policy.",
      });
    }

    const undocumented = policies.filter(
      (policy) =>
        !permissiveWrites.includes(policy) &&
        !expectedPolicyNames.has(`${tableName}|${policy.policyname}`),
    );
    if (undocumented.length > 0) {
      findings.push({
        severity: "LIVE_IS_BETTER",
        area: "rls policy",
        subject: tableName,
        detail: `${undocumented
          .map((policy) => `"${policy.policyname}" (${policy.cmd})`)
          .join(", ")} exists in the database but not in sql/02_rls.sql.`,
        action: "Confirm, then record it in sql/02_rls.sql under the live name.",
      });
    }
  }

  const livePolicyNames = new Set(
    livePolicies.map((policy) => `${policy.tablename}|${policy.policyname}`),
  );
  const missingPolicyByTable = new Map<string, string[]>();
  for (const policy of expectedPolicies) {
    if (livePolicyNames.has(`${policy.table}|${policy.name}`)) continue;
    const list = missingPolicyByTable.get(policy.table) ?? [];
    list.push(`${policy.command}`);
    missingPolicyByTable.set(policy.table, list);
  }
  for (const [tableName, commands] of missingPolicyByTable) {
    findings.push({
      severity: "REPO_IS_BETTER",
      area: "rls policy",
      subject: tableName,
      detail: `sql/02_rls.sql declares ${commands.join(" + ")} policies under names the database does not use.`,
      action:
        "Do not run 02_rls.sql as-is: its `drop policy if exists` guards target names that do not exist, so it would add policies alongside the permissive live ones instead of replacing them.",
    });
  }

  // ---- grants, triggers, comments ----------------------------------------
  for (const grant of liveGrants) {
    const writes = grant.privs
      .split(",")
      .filter((priv) => ["INSERT", "UPDATE", "DELETE", "TRUNCATE"].includes(priv));
    if (grant.grantee === "anon" && writes.length > 0) {
      findings.push({
        severity: "INFO",
        area: "grant",
        subject: `${grant.table_name} -> anon`,
        detail: `Holds ${writes.join(", ")} at table level; only RLS prevents anonymous writes.`,
        action: "Supabase default. Tighten alongside the RLS follow-up if desired.",
      });
    }
  }

  for (const trigger of liveTriggers) {
    findings.push({
      severity: "LIVE_IS_BETTER",
      area: "trigger",
      subject: `${trigger.tbl}.${trigger.tgname}`,
      detail: truncate(trigger.def, 160),
      action: "Confirm, then add it to sql/01_tables.sql.",
    });
  }

  for (const comment of liveComments) {
    const expected = comment.col
      ? expectedTables.get(comment.tbl)?.comments.get(comment.col)
      : undefined;
    if (expected === comment.comment) continue;
    findings.push({
      severity: "LIVE_IS_BETTER",
      area: "comment",
      subject: comment.col ? `${comment.tbl}.${comment.col}` : comment.tbl,
      detail:
        expected === undefined
          ? `Only in the database: "${truncate(comment.comment, 120)}"`
          : `database "${truncate(comment.comment, 60)}" vs DDL "${truncate(expected, 60)}"`,
      action: "Confirm, then add or update the `comment on` statement in sql/01_tables.sql.",
    });
  }

  // ---- aux table contents vs taxonomy.ts ---------------------------------
  const compareAux = (
    label: string,
    live: { id: number; name: string }[],
    code: { id: number; name: string }[],
    codeLocation: string,
  ) => {
    const liveById = new Map(live.map((row) => [row.id, row.name]));
    const codeById = new Map(code.map((row) => [row.id, row.name]));

    for (const [id, name] of liveById) {
      const codeName = codeById.get(id);
      if (codeName === undefined) {
        findings.push({
          severity: "LIVE_IS_BETTER",
          area: `aux ${label}`,
          subject: `id ${id} = "${name}"`,
          detail: `Present in the database but missing from ${codeLocation}.`,
          action: `Confirm, then add it to ${codeLocation} so the loader stops ignoring it.`,
        });
      } else if (codeName !== name) {
        findings.push({
          severity: "LIVE_IS_BETTER",
          area: `aux ${label}`,
          subject: `id ${id}`,
          detail: `database "${name}" vs ${codeLocation} "${codeName}". The loader would rename the live row.`,
          action: `Adopt the database spelling in ${codeLocation}.`,
        });
      }
    }

    for (const [id, name] of codeById) {
      if (liveById.has(id)) continue;
      findings.push({
        severity: "INFO",
        area: `aux ${label}`,
        subject: `id ${id} = "${name}"`,
        detail: `Defined in ${codeLocation} but not yet in the database.`,
        action: "The loader will insert it.",
      });
    }
  };

  compareAux("climate risks", liveAuxRisks, RISKS, "taxonomy.ts RISKS");
  compareAux("themes", liveAuxThemes, THEMES, "taxonomy.ts THEMES");
  compareAux(
    "product categories",
    liveAuxProductCategories,
    PRODUCT_TYPES.map(({ id, name }) => ({ id, name })),
    "taxonomy.ts PRODUCT_TYPES",
  );

  const codeEntityTypeNames = new Set(ENTITY_TYPES.map((type) => type.name));
  for (const row of liveAuxEntityTypes) {
    if (codeEntityTypeNames.has(row.name)) continue;
    findings.push({
      severity: "LIVE_IS_BETTER",
      area: "aux entity types",
      subject: `id ${row.id} = "${row.name}"`,
      detail: "Present in the database but missing from taxonomy.ts ENTITY_TYPES.",
      action: "Confirm, then add it with its CORDIS activity code.",
    });
  }

  // ---- source list vs database ------------------------------------------
  let sourceIds: string[] = [];
  try {
    const raw = await readFile(sourcesPath, "utf8");
    sourceIds = [...raw.matchAll(/project\/id\/(\d+)/g)].map((match) => match[1]);
  } catch {
    findings.push({
      severity: "INFO",
      area: "sources",
      subject: sourcesPath,
      detail: "Could not read the source list.",
      action: "Check the path.",
    });
  }
  const sourceIdSet = new Set(sourceIds);
  for (const project of liveProjects) {
    if (sourceIdSet.has(project.cordis_id)) continue;
    findings.push({
      severity: "INFO",
      area: "sources",
      subject: `${project.cordis_id} (${project.acronym ?? "?"})`,
      detail: "In the database but not in the current sources.csv; the loader never deletes.",
      action: "Decide whether to keep it or remove it by hand.",
    });
  }

  // ---- product type code mapping ----------------------------------------
  const { counts: xmlCodeCounts, files: xmlFileCount } = await collectUnmappedProductCodes(
    downloadsDir,
  );
  const liveCategoryByCode = new Map<string, string>();
  for (const row of liveProductCategoryByCode) {
    const code = (row.type_code ?? "").toUpperCase() || "(no type code)";
    const existing = liveCategoryByCode.get(code);
    const entry = `${row.product_category_id ?? "null"} (${row.n} rows)`;
    liveCategoryByCode.set(code, existing ? `${existing}, ${entry}` : entry);
  }

  // Which category the database currently holds for the bulk of a code's rows,
  // so a changed mapping is visible before the loader moves those rows.
  const dominantLiveCategoryByCode = new Map<string, { categoryId: number | null; rows: number }>();
  for (const row of liveProductCategoryByCode) {
    const code = (row.type_code ?? "").toUpperCase() || "(no type code)";
    const rows = Number(row.n);
    const current = dominantLiveCategoryByCode.get(code);
    if (!current || rows > current.rows) {
      dominantLiveCategoryByCode.set(code, { categoryId: row.product_category_id, rows });
    }
  }

  const productCodeRows: (string | number)[][] = [];
  for (const [code, count] of [...xmlCodeCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const mapped = PRODUCT_TYPE_LOOKUP.get(code);
    productCodeRows.push([
      code,
      count,
      mapped ? `${mapped.id} (${mapped.name})` : "unmapped -> fallback",
      liveCategoryByCode.get(code) ?? "not loaded yet",
    ]);

    if (!mapped) {
      findings.push({
        severity: "LIVE_IS_BETTER",
        area: "product type",
        subject: code,
        detail: `${count} publication(s) in the XML corpus with no PRODUCT_TYPES mapping.`,
        action:
          "Confirm the intended category, then add the code to taxonomy.ts PRODUCT_TYPES; it currently falls back.",
      });
      continue;
    }

    const dominant = dominantLiveCategoryByCode.get(code);
    if (dominant && dominant.categoryId !== null && dominant.categoryId !== mapped.id) {
      findings.push({
        severity: "REPO_IS_BETTER",
        area: "product type",
        subject: code,
        detail:
          `taxonomy.ts now maps this code to category ${mapped.id} ("${mapped.name}"), but ${dominant.rows} ` +
          `existing row(s) sit in category ${dominant.categoryId}. The next push will move them.`,
        action: "Confirm the new mapping is the intended one; the push change log lists every moved row.",
      });
    }
  }

  // ---- render -----------------------------------------------------------
  const grouped = groupFindings(findings);
  const bySeverity = new Map<Severity, Finding[]>(
    SEVERITY_ORDER.map((severity) => [severity, grouped.filter((f) => f.severity === severity)]),
  );

  const md = [
    `# CORDIS live-vs-repo drift report (${stamp})`,
    "",
    "Read-only. Compares the hosted database against `packages/cordis/sql/` and `packages/cordis/src/taxonomy.ts`,",
    "so manual Supabase console edits can be confirmed and folded back into the scripts before a refresh.",
    "",
    `- Tables inspected: **${CORDIS_TABLES.length}**`,
    `- XML files scanned for publication type codes: **${xmlFileCount}**`,
    `- Projects in \`sources.csv\`: **${sourceIds.length}**, in the database: **${liveProjects.length}**`,
    "",
    "## Summary",
    "",
    markdownTable(
      ["severity", "count", "meaning"],
      SEVERITY_ORDER.map((severity) => [
        severity,
        bySeverity.get(severity)?.length ?? 0,
        SEVERITY_BLURB[severity],
      ]),
    ),
    "",
    ...SEVERITY_ORDER.flatMap((severity) => {
      const list = bySeverity.get(severity) ?? [];
      return [
        `## ${severity} (${list.length})`,
        "",
        SEVERITY_BLURB[severity],
        "",
        markdownTable(
          ["area", "subject", "detail", "suggested action"],
          list.map((finding) => [finding.area, finding.subject, finding.detail, finding.action]),
          "_none_",
        ),
        "",
      ];
    }),
    "## CORDIS publication type codes",
    "",
    "How each code in the XML corpus maps today, next to what the database currently stores for it.",
    "",
    markdownTable(
      ["type code", "publications in XML", "taxonomy.ts mapping", "current database categories"],
      productCodeRows,
      "_no publications found_",
    ),
    "",
  ].join("\n");

  const jsonPath = await writeTextReport(
    outDir,
    `drift_${stamp}.json`,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readOnly: true,
        tables: CORDIS_TABLES,
        // Counts are of ungrouped findings; the markdown collapses repeats.
        counts: Object.fromEntries(
          SEVERITY_ORDER.map((severity) => [
            severity,
            findings.filter((finding) => finding.severity === severity).length,
          ]),
        ),
        findings,
        productCodes: productCodeRows,
      },
      null,
      2,
    ),
  );
  const mdPath = await writeTextReport(outDir, `drift_${stamp}.md`, md);

  console.log("Drift report completed (read-only).");
  for (const severity of SEVERITY_ORDER) {
    console.log(`  ${severity}: ${bySeverity.get(severity)?.length ?? 0}`);
  }
  console.log(`- MD:   ${mdPath}`);
  console.log(`- JSON: ${jsonPath}`);

  await sql.end();
}

main().catch(async (error) => {
  console.error("Drift report failed:", error);
  await sql.end().catch(() => undefined);
  process.exit(1);
});
