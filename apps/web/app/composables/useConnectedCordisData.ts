import {
  fetchAuxClimateRisks,
  fetchAuxEntityTypes,
  fetchAuxThemes,
  fetchEntitiesTable,
  fetchProductsTable,
  fetchProjectEntitiesTable,
  fetchProjectRisksTable,
  fetchProjectThemesTable,
  fetchProjectsTable,
} from "~/utils/cordisRepository";
import type { ConnectedProjectEntity } from "~/types/connectedCordis";

export const CONNECTED_CORDIS_KEYS = {
  projects: "connected-cordis-projects",
  entities: "connected-cordis-entities",
  products: "connected-cordis-products",
  projectEntities: "connected-cordis-project-entities",
  projectRisks: "connected-cordis-project-risks",
  projectThemes: "connected-cordis-project-themes",
  risks: "connected-cordis-risks",
  themes: "connected-cordis-themes",
  entityTypes: "connected-cordis-entity-types",
} as const;

function mapProjectEntities(rows: Awaited<ReturnType<typeof fetchProjectEntitiesTable>>): ConnectedProjectEntity[] {
  return rows.map((row) => ({
    project_id: row.projectId,
    entity_id: row.entityId,
    type: row.type,
    entity_order: row.entityOrder,
    total_cost: row.totalCost,
    ec_contribution: row.ecContribution,
    net_ec_contribution: row.netEcContribution,
    sme: row.sme,
    terminated: row.terminated,
  }));
}

export function useConnectedCordisData() {
  const indexesState = useState<unknown>("connected-cordis-indexes", () => null);

  const {
    data: projects,
    pending: projectsPending,
    error: projectsError,
    refresh: refreshProjects,
  } = useAsyncData(CONNECTED_CORDIS_KEYS.projects, fetchProjectsTable);

  const {
    data: entities,
    pending: entitiesPending,
    error: entitiesError,
    refresh: refreshEntities,
  } = useAsyncData(CONNECTED_CORDIS_KEYS.entities, fetchEntitiesTable);

  const {
    data: projectEntitiesRaw,
    pending: projectEntitiesPending,
    error: projectEntitiesError,
    refresh: refreshProjectEntities,
  } = useAsyncData(CONNECTED_CORDIS_KEYS.projectEntities, fetchProjectEntitiesTable);

  const {
    data: projectRisks,
    pending: projectRisksPending,
    error: projectRisksError,
    refresh: refreshProjectRisks,
  } = useAsyncData(CONNECTED_CORDIS_KEYS.projectRisks, fetchProjectRisksTable);

  const {
    data: projectThemes,
    pending: projectThemesPending,
    error: projectThemesError,
    refresh: refreshProjectThemes,
  } = useAsyncData(CONNECTED_CORDIS_KEYS.projectThemes, fetchProjectThemesTable);

  const {
    data: risks,
    pending: risksPending,
    error: risksError,
    refresh: refreshRisks,
  } = useAsyncData(CONNECTED_CORDIS_KEYS.risks, fetchAuxClimateRisks);

  const {
    data: themes,
    pending: themesPending,
    error: themesError,
    refresh: refreshThemes,
  } = useAsyncData(CONNECTED_CORDIS_KEYS.themes, fetchAuxThemes);

  const {
    data: entityTypes,
    pending: entityTypesPending,
    error: entityTypesError,
    refresh: refreshEntityTypes,
  } = useAsyncData(CONNECTED_CORDIS_KEYS.entityTypes, fetchAuxEntityTypes);

  const projectEntities = computed(() => mapProjectEntities(projectEntitiesRaw.value ?? []));

  const pending = computed(
    () =>
      projectsPending.value ||
      entitiesPending.value ||
      projectEntitiesPending.value ||
      projectRisksPending.value ||
      projectThemesPending.value ||
      risksPending.value ||
      themesPending.value ||
      entityTypesPending.value
  );

  const error = computed(
    () =>
      projectsError.value ||
      entitiesError.value ||
      projectEntitiesError.value ||
      projectRisksError.value ||
      projectThemesError.value ||
      risksError.value ||
      themesError.value ||
      entityTypesError.value
  );

  async function refreshConnectedCordisData() {
    indexesState.value = null;
    await Promise.all([
      refreshProjects(),
      refreshEntities(),
      refreshProjectEntities(),
      refreshProjectRisks(),
      refreshProjectThemes(),
      refreshRisks(),
      refreshThemes(),
      refreshEntityTypes(),
    ]);
  }

  return {
    projects,
    entities,
    projectEntities,
    projectRisks,
    projectThemes,
    risks,
    themes,
    entityTypes,
    pending,
    error,
    refreshConnectedCordisData,
  };
}

export function useConnectedCordisProducts() {
  const { data: products, pending, error } = useAsyncData(
    CONNECTED_CORDIS_KEYS.products,
    fetchProductsTable
  );
  return { products, pending, error };
}
