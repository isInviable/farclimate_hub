import type {
  ConnectedCordisIndexes,
  ConnectedCordisRaw,
  ConnectedProjectRow,
  ConnectedSimpleEntity,
  EntityWithProjects,
  ProjectWithSimpleEntities,
} from "~/types/connectedCordis";
import type { EntityRow, ProjectRow } from "~/types/cordis";
import { normalizeEntityNutsId, toRiskOrThemeList } from "~/utils/connectedCordisSetOps";

function enrichProjects(raw: ConnectedCordisRaw): ConnectedProjectRow[] {
  const riskNameById = new Map(raw.risks.map((r) => [r.id, r.name]));
  const themeNameById = new Map(raw.themes.map((t) => [t.id, t.name]));

  const risksByProject = new Map<string, string[]>();
  for (const link of raw.projectRisks) {
    const name = riskNameById.get(link.riskId);
    if (!name) continue;
    const pid = String(link.projectId);
    if (!risksByProject.has(pid)) risksByProject.set(pid, []);
    risksByProject.get(pid)!.push(name);
  }

  const themesByProject = new Map<string, string[]>();
  for (const link of raw.projectThemes) {
    const name = themeNameById.get(link.themeId);
    if (!name) continue;
    const pid = String(link.projectId);
    if (!themesByProject.has(pid)) themesByProject.set(pid, []);
    themesByProject.get(pid)!.push(name);
  }

  return raw.projects.map((project) => {
    const pid = String(project.id);
    const risksList = risksByProject.get(pid) ?? [];
    const themesList = themesByProject.get(pid) ?? [];
    return {
      ...project,
      risksList,
      themesList,
      risks: risksList.length > 0 ? risksList.join("|") : null,
      themes: themesList.length > 0 ? themesList.join("|") : null,
    };
  });
}

export function buildConnectedCordisIndexes(raw: ConnectedCordisRaw): ConnectedCordisIndexes {
  const enrichedProjects = enrichProjects(raw);

  const entityById = new Map<string, EntityRow>();
  for (const entity of raw.entities) entityById.set(entity.id, entity);

  const projectById = new Map<string, ConnectedProjectRow>();
  for (const project of enrichedProjects) projectById.set(project.id, project);

  const entityMap = new Map<string, EntityWithProjects>();
  for (const entity of raw.entities) {
    entityMap.set(entity.id, {
      ...entity,
      projects: [],
      projectsCount: 0,
      projectsTotalCost: 0,
      normalizedNutsId: normalizeEntityNutsId(entity, raw.validNuts3Ids),
    });
  }

  for (const pe of raw.projectEntities) {
    const entity = entityMap.get(pe.entity_id);
    const project = projectById.get(pe.project_id);
    if (!entity || !project) continue;
    entity.projects.push({ ...project, total_cost: pe.total_cost });
    entity.projectsCount = entity.projects.length;
    entity.projectsTotalCost += pe.total_cost ?? 0;
  }

  const entitiesWithProjects = Array.from(entityMap.values());

  const projectMap = new Map<string, ProjectWithSimpleEntities>();
  for (const project of enrichedProjects) {
    projectMap.set(project.id, { ...project, entities: [], entitiesCount: 0 });
  }

  for (const pe of raw.projectEntities) {
    const project = projectMap.get(pe.project_id);
    const entity = entityById.get(pe.entity_id);
    if (!project || !entity) continue;
    project.entities.push({
      id: entity.id,
      legal_name: entity.legal_name,
      short_name: entity.short_name,
      type: pe.type,
      total_cost: pe.total_cost,
    });
    project.entitiesCount = project.entities.length;
  }

  const projectsWithSimpleEntities = Array.from(projectMap.values());

  const projectsByRisk = new Map<string, Set<string>>();
  const projectsByTheme = new Map<string, Set<string>>();
  const entitiesByProject = new Map<string, Set<string>>();
  const risksByProject = new Map<string, Set<string>>();
  const themesByProject = new Map<string, Set<string>>();

  for (const project of projectsWithSimpleEntities) {
    const riskNames = new Set(toRiskOrThemeList(project.risks));
    const themeNames = new Set(toRiskOrThemeList(project.themes));
    risksByProject.set(project.id, riskNames);
    themesByProject.set(project.id, themeNames);

    const entityIds = new Set(project.entities.map((e) => e.id));
    entitiesByProject.set(project.id, entityIds);

    for (const risk of riskNames) {
      if (!projectsByRisk.has(risk)) projectsByRisk.set(risk, new Set());
      projectsByRisk.get(risk)!.add(project.id);
    }
    for (const theme of themeNames) {
      if (!projectsByTheme.has(theme)) projectsByTheme.set(theme, new Set());
      projectsByTheme.get(theme)!.add(project.id);
    }
  }

  const projectsByEntity = new Map<string, Set<string>>();
  const entitiesByRegion = new Map<string, Set<string>>();
  const entityToRegion = new Map<string, string>();

  for (const entity of entitiesWithProjects) {
    for (const project of entity.projects) {
      if (!projectsByEntity.has(entity.id)) projectsByEntity.set(entity.id, new Set());
      projectsByEntity.get(entity.id)!.add(project.id);
    }
    if (entity.normalizedNutsId) {
      entityToRegion.set(entity.id, entity.normalizedNutsId);
      if (!entitiesByRegion.has(entity.normalizedNutsId)) {
        entitiesByRegion.set(entity.normalizedNutsId, new Set());
      }
      entitiesByRegion.get(entity.normalizedNutsId)!.add(entity.id);
    }
  }

  const riskOptions = [...raw.risks].sort((a, b) => a.name.localeCompare(b.name));
  const themeOptions = [...raw.themes].sort((a, b) => a.name.localeCompare(b.name));

  return {
    entityById,
    projectById,
    entitiesWithProjects,
    projectsWithSimpleEntities,
    projectsByRisk,
    projectsByTheme,
    projectsByEntity,
    entitiesByRegion,
    entitiesByProject,
    risksByProject,
    themesByProject,
    entityToRegion,
    riskOptions,
    themeOptions,
    regions: raw.nutsNameById,
  };
}

export function buildPrjEntProjectOptions(
  projects: ProjectRow[],
  projectRisks: { projectId: string; riskId: number }[],
  risks: { id: number; name: string }[]
) {
  const riskNameById = new Map(risks.map((r) => [r.id, r.name]));
  const risksByProject = new Map<string, string[]>();

  for (const link of projectRisks) {
    const name = riskNameById.get(link.riskId);
    if (!name) continue;
    const pid = String(link.projectId);
    if (!risksByProject.has(pid)) risksByProject.set(pid, []);
    risksByProject.get(pid)!.push(name);
  }

  return projects.map((project) => {
    const pid = String(project.id);
    const projectRisksList = risksByProject.get(pid) ?? [];
    return {
      ...project,
      risks: projectRisksList.length > 0 ? projectRisksList : undefined,
      start_year: project.start_date ? new Date(project.start_date).getFullYear() : null,
      end_year: project.end_date ? new Date(project.end_date).getFullYear() : null,
    };
  });
}
