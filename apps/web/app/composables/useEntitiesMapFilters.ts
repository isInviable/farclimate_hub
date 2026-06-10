import type { ConnectedCordisIndexes, EntityWithProjects } from "~/types/connectedCordis";
import { intersectSets, unionFromMap } from "~/utils/connectedCordisSetOps";

export function useEntitiesMapFilters(indexes: Ref<ConnectedCordisIndexes | null>) {
  const selectedProjects = ref<string[]>([]);
  const selectedRisks = ref<string[]>([]);
  const selectedThemes = ref<string[]>([]);
  const selectedEntities = ref<string[]>([]);
  const selectedNutsIds = ref<string[]>([]);
  const hoveredNutsId = ref<string | null>(null);
  const selectionMode = ref<"nuts" | "entities">("nuts");
  const minEntitiesPerNuts = ref(1);

  const selectedProjectsSet = computed(() => new Set(selectedProjects.value));
  const selectedRisksSet = computed(() => new Set(selectedRisks.value));
  const selectedThemesSet = computed(() => new Set(selectedThemes.value));
  const selectedEntitiesSet = computed(() => new Set(selectedEntities.value));
  const selectedNutsIdsSet = computed(() => new Set(selectedNutsIds.value));

  const entitiesWithProjects = computed(() => indexes.value?.entitiesWithProjects ?? []);
  const projectsWithSimpleEntities = computed(() => indexes.value?.projectsWithSimpleEntities ?? []);
  const riskOptions = computed(() => indexes.value?.riskOptions ?? []);
  const themeOptions = computed(() => indexes.value?.themeOptions ?? []);

  const entityCountByRegion = computed(() => {
    const idx = indexes.value;
    if (!idx) return new Map<string, number>();

    const counts = new Map<string, number>();
    for (const [regionId, entityIds] of idx.entitiesByRegion) {
      counts.set(regionId, entityIds.size);
    }
    return counts;
  });

  const maxEntityCountPerNuts = computed(() => {
    let max = 0;
    for (const count of entityCountByRegion.value.values()) {
      max = Math.max(max, count);
    }
    return Math.max(max, 1);
  });

  const isNutsEntityCountFilterActive = computed(() => minEntitiesPerNuts.value > 0);

  const regionsMatchingEntityCount = computed(() => {
    if (!isNutsEntityCountFilterActive.value) return null;

    const allowed = new Set<string>();
    for (const [regionId, count] of entityCountByRegion.value) {
      if (count >= minEntitiesPerNuts.value) allowed.add(regionId);
    }
    return allowed;
  });

  const mapEntities = computed(() => {
    const allowed = regionsMatchingEntityCount.value;
    if (!allowed) return entitiesWithProjects.value;

    return entitiesWithProjects.value.filter(
      (entity) => entity.normalizedNutsId && allowed.has(entity.normalizedNutsId)
    );
  });

  const visibleEntityIds = computed(() => new Set(mapEntities.value.map((e) => e.id)));

  function allProjectIds(): Set<string> {
    const result = new Set<string>();
    for (const project of projectsWithSimpleEntities.value) result.add(project.id);
    return result;
  }

  function projectsMatchingFilters(options?: {
    includeProjectSelection?: boolean;
    includeRiskSelection?: boolean;
    includeThemeSelection?: boolean;
  }) {
    const idx = indexes.value;
    if (!idx) return new Set<string>();

    const includeProjectSelection = options?.includeProjectSelection ?? true;
    const includeRiskSelection = options?.includeRiskSelection ?? true;
    const includeThemeSelection = options?.includeThemeSelection ?? true;
    let candidates = allProjectIds();

    if (includeProjectSelection && selectedProjectsSet.value.size > 0) {
      candidates = intersectSets(candidates, selectedProjectsSet.value);
    }

    if (includeRiskSelection && selectedRisksSet.value.size > 0) {
      candidates = intersectSets(candidates, unionFromMap(selectedRisksSet.value, idx.projectsByRisk));
    }

    if (includeThemeSelection && selectedThemesSet.value.size > 0) {
      candidates = intersectSets(candidates, unionFromMap(selectedThemesSet.value, idx.projectsByTheme));
    }

    if (selectedEntitiesSet.value.size > 0) {
      candidates = intersectSets(candidates, unionFromMap(selectedEntitiesSet.value, idx.projectsByEntity));
    }

    if (selectedNutsIdsSet.value.size > 0) {
      const regionEntities = unionFromMap(selectedNutsIdsSet.value, idx.entitiesByRegion);
      candidates = intersectSets(candidates, unionFromMap(regionEntities, idx.projectsByEntity));
    }

    return candidates;
  }

  const activeProjects = computed(() => projectsMatchingFilters());

  const hasFilters = computed(
    () =>
      selectedProjectsSet.value.size > 0 ||
      selectedRisksSet.value.size > 0 ||
      selectedThemesSet.value.size > 0 ||
      selectedEntitiesSet.value.size > 0 ||
      selectedNutsIdsSet.value.size > 0
  );

  const selectableProjects = computed(() => projectsMatchingFilters({ includeProjectSelection: false }));

  const activeEntities = computed(() => {
    const idx = indexes.value;
    if (!idx) return new Set<string>();

    let active: Set<string>;
    if (!hasFilters.value) {
      active = new Set(entitiesWithProjects.value.map((e) => e.id));
    } else {
      active = unionFromMap(activeProjects.value, idx.entitiesByProject);
    }

    if (isNutsEntityCountFilterActive.value) {
      active = intersectSets(active, visibleEntityIds.value);
    }

    return active;
  });

  const activeRegions = computed(() => {
    const idx = indexes.value;
    if (!idx) return new Set<string>();

    const regions = new Set<string>();
    for (const entityId of activeEntities.value) {
      const region = idx.entityToRegion.get(entityId);
      if (region) regions.add(region);
    }
    return regions;
  });

  const selectableRisks = computed(() => {
    const idx = indexes.value;
    if (!idx) return new Set<string>();
    return unionFromMap(
      projectsMatchingFilters({ includeRiskSelection: false }),
      idx.risksByProject
    );
  });

  const selectableThemes = computed(() => {
    const idx = indexes.value;
    if (!idx) return new Set<string>();
    return unionFromMap(
      projectsMatchingFilters({ includeThemeSelection: false }),
      idx.themesByProject
    );
  });

  const panelActiveRisks = computed(() => {
    if (selectedRisksSet.value.size > 0) {
      const active = new Set<string>();
      for (const risk of selectedRisksSet.value) {
        if (selectableRisks.value.has(risk)) active.add(risk);
      }
      return active;
    }
    return selectableRisks.value;
  });

  const panelActiveThemes = computed(() => {
    if (selectedThemesSet.value.size > 0) {
      const active = new Set<string>();
      for (const theme of selectedThemesSet.value) {
        if (selectableThemes.value.has(theme)) active.add(theme);
      }
      return active;
    }
    return selectableThemes.value;
  });

  const filteredActiveProjects = computed(() =>
    projectsWithSimpleEntities.value.filter((project) => activeProjects.value.has(project.id))
  );

  function toggleInList(list: Ref<string[]>, value: string, isActive: boolean) {
    if (!isActive) return;
    const index = list.value.indexOf(value);
    if (index > -1) list.value.splice(index, 1);
    else list.value.push(value);
  }

  function toggleRisk(riskName: string) {
    toggleInList(selectedRisks, riskName, selectableRisks.value.has(riskName));
  }

  function toggleTheme(themeName: string) {
    toggleInList(selectedThemes, themeName, selectableThemes.value.has(themeName));
  }

  function toggleProject(projectId: string) {
    const eligible = projectsMatchingFilters({ includeProjectSelection: false });
    toggleInList(selectedProjects, projectId, eligible.has(projectId));
  }

  function toggleEntity(entityId: string) {
    toggleInList(selectedEntities, entityId, activeEntities.value.has(entityId));
  }

  function toggleNuts(nutsId: string) {
    if (!nutsId) return;
    const index = selectedNutsIds.value.indexOf(nutsId);
    if (index > -1) selectedNutsIds.value.splice(index, 1);
    else selectedNutsIds.value.push(nutsId);
  }

  function getEntitiesByNutsId(nutsId: string): EntityWithProjects[] {
    return entitiesWithProjects.value.filter((entity) => entity.normalizedNutsId === nutsId);
  }

  const hoveredEntities = computed(() => {
    if (!hoveredNutsId.value) return [];
    return getEntitiesByNutsId(hoveredNutsId.value);
  });

  const entitiesWithoutGeolocation = computed(() =>
    entitiesWithProjects.value.filter(
      (entity) => !entity.address_geolocation || entity.address_geolocation.trim() === ""
    )
  );

  const entitiesWithoutProjects = computed(() =>
    entitiesWithProjects.value.filter((entity) => (entity.projectsCount ?? 0) === 0)
  );

  const entitiesWithoutNuts = computed(() =>
    entitiesWithProjects.value.filter((entity) => !entity.normalizedNutsId)
  );

  watch(regionsMatchingEntityCount, (allowed) => {
    if (!allowed) return;
    selectedNutsIds.value = selectedNutsIds.value.filter((id) => allowed.has(id));
  });

  watch(selectionMode, (mode) => {
    if (mode === "entities") hoveredNutsId.value = null;
  });

  return {
    selectedProjects,
    selectedRisks,
    selectedThemes,
    selectedEntities,
    selectedNutsIds,
    hoveredNutsId,
    selectionMode,
    minEntitiesPerNuts,
    maxEntityCountPerNuts,
    isNutsEntityCountFilterActive,
    regionsMatchingEntityCount,
    entityCountByRegion,
    mapEntities,
    entitiesWithProjects,
    projectsWithSimpleEntities,
    riskOptions,
    themeOptions,
    activeProjects,
    selectableProjects,
    activeEntities,
    activeRegions,
    selectableRisks,
    selectableThemes,
    panelActiveRisks,
    panelActiveThemes,
    filteredActiveProjects,
    hoveredEntities,
    entitiesWithoutGeolocation,
    entitiesWithoutProjects,
    entitiesWithoutNuts,
    toggleRisk,
    toggleTheme,
    toggleProject,
    toggleEntity,
    toggleNuts,
    getEntitiesByNutsId,
  };
}
