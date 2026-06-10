import type { AuxClimateRisk, AuxEntityType, AuxTheme, EntityRow, ProjectRow } from "~/types/cordis";

export type ConnectedProjectEntity = {
  project_id: string;
  entity_id: string;
  type: string | null;
  entity_order: number | null;
  total_cost: number | null;
  ec_contribution: number | null;
  net_ec_contribution: number | null;
  sme: number | null;
  terminated: number | null;
};

export type ConnectedProjectRow = ProjectRow & {
  risksList: string[];
  themesList: string[];
};

export type ConnectedSimpleEntity = {
  id: string;
  legal_name: string | null;
  short_name: string | null;
  type: string | null;
  total_cost: number | null;
};

export type EntityWithProjects = EntityRow & {
  projects: (ConnectedProjectRow & { total_cost: number | null })[];
  projectsCount: number;
  projectsTotalCost: number;
  normalizedNutsId: string | null;
};

export type ProjectWithSimpleEntities = ConnectedProjectRow & {
  entities: ConnectedSimpleEntity[];
  entitiesCount: number;
};

export type ConnectedCordisIndexes = {
  entityById: Map<string, EntityRow>;
  projectById: Map<string, ConnectedProjectRow>;
  entitiesWithProjects: EntityWithProjects[];
  projectsWithSimpleEntities: ProjectWithSimpleEntities[];
  projectsByRisk: Map<string, Set<string>>;
  projectsByTheme: Map<string, Set<string>>;
  projectsByEntity: Map<string, Set<string>>;
  entitiesByRegion: Map<string, Set<string>>;
  entitiesByProject: Map<string, Set<string>>;
  risksByProject: Map<string, Set<string>>;
  themesByProject: Map<string, Set<string>>;
  entityToRegion: Map<string, string>;
  riskOptions: AuxClimateRisk[];
  themeOptions: AuxTheme[];
  regions: Map<string, string>;
};

export type ConnectedCordisRaw = {
  projects: ProjectRow[];
  entities: EntityRow[];
  projectEntities: ConnectedProjectEntity[];
  projectRisks: { projectId: string; riskId: number }[];
  projectThemes: { projectId: string; themeId: number }[];
  risks: AuxClimateRisk[];
  themes: AuxTheme[];
  entityTypes: AuxEntityType[];
  nutsNameById: Map<string, string>;
  validNuts3Ids: Set<string>;
};
