import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { RISK_BY_ID, RISKS, THEME_BY_ID, THEMES, type TaxonomyItem } from "./taxonomy.js";

// Climate risk and main theme assignments come from the Mission Projects
// Catalogue PDF, parsed once into two committed CSVs. They replace the old
// keyword-substring heuristic that guessed tags from CORDIS wording.

export type CategoryAssignment = {
  projectId: string;
  categoryId: number;
};

export type PdfCategoryResult = {
  projectRisks: CategoryAssignment[];
  projectThemes: CategoryAssignment[];
  warnings: string[];
};

type CategoryCsvRow = {
  project_number?: string;
  acronym?: string;
  risk_id?: string;
  risk_name?: string;
  theme_id?: string;
  theme_name?: string;
  pdf_legend_name?: string;
};

type CategoryKind = "risk" | "theme";

function readCategoryCsv(content: string): CategoryCsvRow[] {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CategoryCsvRow[];
}

function parseAssignments(
  kind: CategoryKind,
  filePath: string,
  rows: CategoryCsvRow[],
  taxonomy: TaxonomyItem[],
  taxonomyById: Map<number, TaxonomyItem>,
  knownProjectIds: Set<string>,
): { assignments: CategoryAssignment[]; warnings: string[] } {
  const idColumn = kind === "risk" ? "risk_id" : "theme_id";
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  const assignments: CategoryAssignment[] = [];
  const unknownProjects = new Set<string>();

  rows.forEach((row, index) => {
    // CSV line number, accounting for the header row.
    const line = index + 2;
    const projectId = (row.project_number ?? "").trim();
    const rawId = (row[idColumn] ?? "").trim();
    const legendName = (row.pdf_legend_name ?? "").trim();

    if (!projectId) {
      errors.push(`line ${line}: missing project_number`);
      return;
    }
    if (!rawId) {
      errors.push(`line ${line} (project ${projectId}): missing ${idColumn}`);
      return;
    }

    const categoryId = Number(rawId);
    if (!Number.isInteger(categoryId)) {
      errors.push(`line ${line} (project ${projectId}): ${idColumn} "${rawId}" is not an integer`);
      return;
    }

    const known = taxonomyById.get(categoryId);
    if (!known) {
      errors.push(
        `line ${line} (project ${projectId}): unknown ${kind} id ${categoryId}. ` +
          `taxonomy.ts defines ids ${taxonomy.map((item) => item.id).join(", ")}. ` +
          `Add the new legend entry to taxonomy.ts and to aux_${kind === "risk" ? "climate_risks" : "themes"} before loading.`,
      );
      return;
    }

    if (legendName && legendName !== known.name) {
      errors.push(
        `line ${line} (project ${projectId}): ${kind} ${categoryId} pdf_legend_name "${legendName}" ` +
          `does not match taxonomy.ts name "${known.name}". Reconcile the two before loading.`,
      );
      return;
    }

    if (!knownProjectIds.has(projectId)) {
      unknownProjects.add(projectId);
      return;
    }

    const key = `${projectId}|${categoryId}`;
    if (seen.has(key)) return;
    seen.add(key);
    assignments.push({ projectId, categoryId });
  });

  const projectsWithoutTags = [...knownProjectIds]
    .filter((projectId) => !assignments.some((a) => a.projectId === projectId))
    .sort();
  if (projectsWithoutTags.length > 0) {
    errors.push(
      `no ${kind} rows for ${projectsWithoutTags.length} project(s) present in the XML corpus: ` +
        `${projectsWithoutTags.join(", ")}. Every project in the source list needs catalogue ${kind}s.`,
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `${filePath} failed validation (${errors.length} problem(s)):\n  - ${errors.join("\n  - ")}`,
    );
  }

  if (unknownProjects.size > 0) {
    const listed = [...unknownProjects].sort();
    const shown = listed.slice(0, 10).join(", ");
    const rest = listed.length > 10 ? `, ...and ${listed.length - 10} more` : "";
    warnings.push(
      `${filePath}: ignored ${kind} rows for ${unknownProjects.size} project(s) that are not in the ` +
        `XML corpus: ${shown}${rest}`,
    );
  }

  return { assignments, warnings };
}

/**
 * Loads catalogue risk and theme assignments and validates them against
 * `taxonomy.ts` and the set of projects actually parsed from XML.
 *
 * Throws on an unknown id, a legend name that disagrees with `taxonomy.ts`, or
 * a parsed project with no assignments, so a future catalogue edition cannot
 * silently reshape the tags.
 */
export async function loadPdfCategories(options: {
  risksCsvPath: string;
  themesCsvPath: string;
  knownProjectIds: Iterable<string>;
}): Promise<PdfCategoryResult> {
  const knownProjectIds = new Set(options.knownProjectIds);

  const [risksContent, themesContent] = await Promise.all([
    readFile(options.risksCsvPath, "utf8"),
    readFile(options.themesCsvPath, "utf8"),
  ]);

  const risks = parseAssignments(
    "risk",
    options.risksCsvPath,
    readCategoryCsv(risksContent),
    RISKS,
    RISK_BY_ID,
    knownProjectIds,
  );
  const themes = parseAssignments(
    "theme",
    options.themesCsvPath,
    readCategoryCsv(themesContent),
    THEMES,
    THEME_BY_ID,
    knownProjectIds,
  );

  return {
    projectRisks: risks.assignments,
    projectThemes: themes.assignments,
    warnings: [...risks.warnings, ...themes.warnings],
  };
}
