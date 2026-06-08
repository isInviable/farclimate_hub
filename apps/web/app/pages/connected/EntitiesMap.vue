
<template>

  <div class="bg-neutral-lightest">
    <CaPageHeader
      n="02"
      kicker="ENTITIES MAP"
      title="Entities Map"
      intro="Where the network lives. Every participating organisation is placed on the map of Europe; filter by climate risk or theme to see which regions are involved, and hover a NUTS3 region for its breakdown."
      help-title="Reading the map"
      help="Dot size reflects the total project funding tied to each entity; colour deepens with the number of projects it joins. Selecting risks or themes dims everything outside the matching projects."
    />

    <div class="mx-auto w-full max-w-[1920px] px-7 py-7 pb-24">
      <div class="relative h-[80vh] min-h-[640px] overflow-hidden border border-neutral-darkest">
        <!-- map (behind the floating panels) -->
        <div class="absolute inset-0">
          <EntitiesMap
            :entities="entitiesWithProjectsTotalCost || []"
            :overedNutsId="overedNutsId"
            :active-nuts-id="activeNutsId"
            :nuts_shapes="nuts_shapes"
            :selectedNutsIds="selectedNutsIds"
            :active-regions="activeRegions"
            :active-entities="activeEntities"
            @updateNutsId="(nutsId) => { overedNutsId = nutsId }"
            @updateActiveNutsId="(nutsId) => { 
                if (nutsId) {
                    const index = selectedNutsIds.indexOf(nutsId);
                    if (index > -1) {
                        selectedNutsIds.splice(index, 1);
                    } else {
                        selectedNutsIds.push(nutsId);
                    }
                }
            }"
          />
        </div>

        <!-- Left panels: filters -->
        <article class="absolute left-3 top-3 z-10 flex max-h-[calc(100%-24px)] w-[300px] flex-col gap-2 overflow-y-auto">

            <!-- panel risks -->
          <SidePanel
            :title="'Risks'"
            :tot="riskOptions ? riskOptions.length : 0"
            :count_active="activeRisks.size"
            :count_selected="selectedRisks.length"
          >
           
            <template #content>
            <ul>
                <li 
                    v-for="risk in riskOptions" 
                    :key="risk.id"
                    class="cursor-pointer border-b border-neutral-lighter py-1 transition-colors duration-200"
                    :class="[
                        !activeRisks.has(risk.name) ? 'opacity-40 text-neutral-dark' : 'hover:bg-warm-neutral-100',
                        selectedRisks.includes(risk.name) ? 'bg-trust-blue-lightest font-semibold text-trust-blue-darkest' : ''
                    ]"
                    @click="toggleRisk(risk.name)"
                >
                    {{ risk.name }}
                </li>
            </ul>
            </template>

          </SidePanel>

            <!-- panel themes -->
            <SidePanel
            :title="'Themes'"
            :tot="themeOptions ? themeOptions.length : 0"
            :count_active="activeThemes.size"
            :count_selected="selectedThemes.length"
          >
           
            <template #content>
            <ul>
                <li 
                    v-for="theme in themeOptions" 
                    :key="theme.id"
                    class="cursor-pointer border-b border-neutral-lighter py-1 transition-colors duration-200"
                    :class="[
                        !activeThemes.has(theme.name) ? 'opacity-40 text-neutral-dark' : 'hover:bg-warm-neutral-100',
                        selectedThemes.includes(theme.name) ? 'bg-trust-blue-lightest font-semibold text-trust-blue-darkest' : ''
                    ]"
                    @click="toggleTheme(theme.name)"
                >
                    {{ theme.name }}
                </li>
            </ul>
            </template>

            </SidePanel>

             <!-- panel projects -->
            <SidePanel
                :title="'Projects'"
                :tot="projectsWithSimpleEntities.length"
                :count_active="activeProjects.size"
          >
           
            <template #content>
                <ul>
                <li 
                    v-for="project in filteredActiveProjects" 
                    :key="project.id"
                    class="border-b border-neutral-lighter py-1"
                >
                    {{ project.acronym || project.title || project.id }}
                </li>
                </ul>
            </template>

            </SidePanel>

            <!-- panel entities -->
            <SidePanel
                :title="'Entities'"
                :tot="entitiesWithProjectsTotalCost.length"
                :count_active="activeEntities.size"
          >
             
              <template #content>
                    <ul>
                    <li 
                     v-for="entity in entitiesWithProjectsTotalCost" 
                     :key="entity.id"
                     class="border-b border-neutral-lighter py-1"
                    >
                     {{ entity.short_name || entity.legal_name || entity.id }}
                     <p class="text-2xs text-neutral-dark">Projects: {{ entity.projectsCount }} | Total Cost: {{ entity.projectsTotalCost }}</p>
                    </li>
                    </ul>
              </template>
            </SidePanel>
         

        </article>

        <!-- NUTS panel: region read-out -->
        <article class="absolute right-3 top-3 z-10 w-[300px] text-xs">

            <SidePanel
                :title="'regions NUTS3'"
                :tot="regions.size"
                :count_active="activeRegions.size"
                :count_selected="selectedNutsIds.length"
            > 
            <template #content>
               <ul class="max-h-[200px] overflow-y-auto">
                <li 
                    v-for="(name, id) in regions" 
                    :key="id"
                    class="border-b border-neutral-lighter py-1"
                >
                    {{ name }} ({{ id }})
                </li>
               </ul>
            </template>

            </SidePanel>

            <div class="mt-2 border border-neutral-darkest bg-neutral-lightest p-3">
              <div class="flex justify-between gap-2">
                <p class="font-mono text-[11px] text-neutral-darkest">{{ overedNutsId ? getNutsNameById(overedNutsId) : 'Hover over a NUTS area' }}</p>
                <p class="text-right font-mono text-[11px]"><strong class="text-trust-blue-darkest">{{ overedEntities.length }}</strong> entities</p>
              </div>

              <div class="mt-2 min-h-12 border-t border-neutral-lighter pt-3">
                <ul>
                  <li v-for="nut in selectedNutsIds" :key="nut" class="font-mono text-[11px] text-neutral-dark">
                    {{ getNutsNameById(nut) }} ({{ nut }})
                  </li>
                </ul>
              </div>
            </div>

        </article>

        <!-- Info button -->
        <UButton
          icon="i-heroicons-information-circle"
          color="primary"
          size="lg"
          square
          class="absolute bottom-4 right-4 z-50 shadow-lg"
          @click="showNoGeolocationModal = true"
        >
          <span class="sr-only">Entities without geolocation</span>
        </UButton>
      </div>
    </div>

    <!-- Modal for entities without geolocation or projects -->
    <UModal
      v-model:open="showNoGeolocationModal"
      title="Entities Information"
    >
      <template #body>
        <UTabs :items="infoModalTabs" v-model="selectedInfoTab">
          <template #without-geolocation>
            <div class="max-h-[60vh] overflow-y-auto mt-4">
              <UTable
                :data="entitiesWithoutGeolocation"
                :columns="noGeolocationColumns"
                empty="No entities without geolocation"
              >
                <template #legal_name-cell="{ row }">
                  {{ (row.original as any).legal_name || '—' }}
                </template>
                <template #short_name-cell="{ row }">
                  {{ (row.original as any).short_name || '—' }}
                </template>
                <template #address_country-cell="{ row }">
                  {{ (row.original as any).address_country || '—' }}
                </template>
                <template #projectsCount-cell="{ row }">
                  {{ (row.original as any).projectsCount || 0 }}
                </template>
                <template #projectsTotalCost-cell="{ row }">
                  {{ (row.original as any).projectsTotalCost ? (row.original as any).projectsTotalCost.toLocaleString() : '—' }}
                </template>
              </UTable>
            </div>
          </template>
          <template #without-projects>
            <div class="max-h-[60vh] overflow-y-auto mt-4">
              <UTable
                :data="entitiesWithoutProjects"
                :columns="noGeolocationColumns"
                empty="No entities without projects"
              >
                <template #legal_name-cell="{ row }">
                  {{ (row.original as any).legal_name || '—' }}
                </template>
                <template #short_name-cell="{ row }">
                  {{ (row.original as any).short_name || '—' }}
                </template>
                <template #address_country-cell="{ row }">
                  {{ (row.original as any).address_country || '—' }}
                </template>
                <template #projectsCount-cell="{ row }">
                  {{ (row.original as any).projectsCount || 0 }}
                </template>
                <template #projectsTotalCost-cell="{ row }">
                  {{ (row.original as any).projectsTotalCost ? (row.original as any).projectsTotalCost.toLocaleString() : '—' }}
                </template>
              </UTable>
            </div>
          </template>
        </UTabs>
      </template>
    </UModal>

  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'connected' });
import type { EntityRow, ProjectRow, AuxClimateRisk, AuxTheme } from "~/types/cordis";
import nuts_shapes from "~/assets/geo/NUTS_RG_60M_2024_4326_LEVL_3.json";

  const supabase = useSupabaseClient();

  // ProjectEntityRow type (matches database schema)
  type ProjectEntityRow = {
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

  // Fetch entities from Supabase (using shared EntityRow type)
  const { data: entityRows, pending: loadingEntities, error: entitiesError } = await useAsyncData(
    'entities-map-relationship-entities',
    async () => {
      const { data, error } = await supabase
        .from('entities_cordis')
        .select('id, vat_number, legal_name, short_name, address_country, address_geolocation, related_nuts_code_nuts_code')
        .order('legal_name');
      
      if (error) throw error;
      return (data ?? []) as EntityRow[];
    }
  );

  // Fetch project-entities from Supabase
  const {
    data: projectEntitiesRows,
    pending: loadingProjectEntities,
    error: projectEntitiesError
  } = await useAsyncData('entities-map-relationship-project-entities', async () => {
    const { data, error } = await supabase
      .from('project_entities')
      .select('project_id, entity_id, type, entity_order, total_cost, ec_contribution, net_ec_contribution, sme, terminated')
      .order('project_id', { ascending: true });
    
    if (error) throw error;
    return (data ?? []) as ProjectEntityRow[];
  });

  // Fetch projects from Supabase (with risks/themes computed from junction tables)
  const {
    data: projectOptions,
    pending: loadingProjects,
    error: projectsError
  } = await useAsyncData('entities-map-project-options', async () => {
    // Fetch projects
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects_cordis')
      .select('id, title, acronym, start_date, end_date, total_cost, duration')
      .order('start_date', { ascending: false });
    
    if (projectsError) throw projectsError;
    
    const projectIds = (projectsData ?? []).map((p: any) => p.id);
    
    if (projectIds.length === 0) {
      return [];
    }
    
    // Fetch risks and themes junction tables and aux tables in parallel
    const [
      { data: riskLinks, error: riskLinksError },
      { data: themeLinks, error: themeLinksError },
      { data: risks, error: risksError },
      { data: themes, error: themesError },
    ] = await Promise.all([
      supabase
        .from('project_risks')
        .select('project_id, risk_id')
        .in('project_id', projectIds),
      supabase
        .from('project_themes')
        .select('project_id, theme_id')
        .in('project_id', projectIds),
      supabase
        .from('aux_climate_risks')
        .select('id, name'),
      supabase
        .from('aux_themes')
        .select('id, name'),
    ]);
    
    if (riskLinksError) throw riskLinksError;
    if (themeLinksError) throw themeLinksError;
    if (risksError) throw risksError;
    if (themesError) throw themesError;
    
    // Create lookup maps
    const riskNameById = new Map<number, string>();
    (risks ?? []).forEach((r: any) => {
      riskNameById.set(r.id, r.name);
    });
    
    const themeNameById = new Map<number, string>();
    (themes ?? []).forEach((t: any) => {
      themeNameById.set(t.id, t.name);
    });
    
    // Build risks and themes maps by project_id
    const risksByProject = new Map<string, string[]>();
    (riskLinks ?? []).forEach((link: any) => {
      if (!link.project_id || !link.risk_id) return;
      const riskName = riskNameById.get(link.risk_id);
      if (!riskName) return;
      const pid = String(link.project_id);
      if (!risksByProject.has(pid)) {
        risksByProject.set(pid, []);
      }
      risksByProject.get(pid)!.push(riskName);
    });
    
    const themesByProject = new Map<string, string[]>();
    (themeLinks ?? []).forEach((link: any) => {
      if (!link.project_id || !link.theme_id) return;
      const themeName = themeNameById.get(link.theme_id);
      if (!themeName) return;
      const pid = String(link.project_id);
      if (!themesByProject.has(pid)) {
        themesByProject.set(pid, []);
      }
      themesByProject.get(pid)!.push(themeName);
    });
    
    // Add computed risks/themes as pipe-separated strings to ProjectRow
    return (projectsData ?? []).map((project: ProjectRow) => {
      const pid = String(project.id);
      const projectRisks = risksByProject.get(pid) ?? [];
      const projectThemes = themesByProject.get(pid) ?? [];
      
      return {
        ...project,
        risks: projectRisks.length > 0 ? projectRisks.join('|') : null,
        themes: projectThemes.length > 0 ? projectThemes.join('|') : null,
      } as ProjectRow;
    });
  });

  // Fetch risk options from Supabase (using shared type AuxClimateRisk)
  const { data: riskOptions, pending: loadingRisks, error: riskError } = await useAsyncData(
    'entities-map-risk-options',
    async () => {
      const { data, error } = await supabase
        .from('aux_climate_risks')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return (data ?? []) as AuxClimateRisk[];
    }
  );

  // Fetch theme options from Supabase (using shared type AuxTheme)
  const { data: themeOptions, pending: loadingThemes, error: themeError } = await useAsyncData(
    'entities-map-theme-options',
    async () => {
      const { data, error } = await supabase
        .from('aux_themes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return (data ?? []) as AuxTheme[];
    }
  );


  // a computed function that returns nuts names
  const regions = computed(() => {
    const regionMap = new Map<string, string>();
    nuts_shapes.features.forEach((feature: any) => {
        regionMap.set(feature.properties.NUTS_ID, feature.properties.NUTS_NAME);
    });
    return regionMap;
  });
  

  // an array like entitiesWithProjects
  // BUT including the total_cost from project-entities table
  // AND a property called "projectsTotalCost" summing up total_cost values
  const entitiesWithProjectsTotalCost = computed(() => {
    const entityMap = new Map<string, EntityRow & { projects: (ProjectRow & { total_cost: number | null })[], projectsCount: number, projectsTotalCost: number }>();
    (entityRows.value ?? []).forEach((entity) => {
      entityMap.set(entity.id, { ...entity, projects: [], projectsCount: 0, projectsTotalCost: 0 });
    }); 
    (projectEntitiesRows.value ?? []).forEach((pe) => {
      const entity = entityMap.get(pe.entity_id);
      const project = projectOptions.value?.find((p) => p.id === pe.project_id);
      if (entity && project) {
        entity.projects.push({ ...project, total_cost: pe.total_cost });
        entity.projectsCount = entity.projects.length;
        entity.projectsTotalCost += pe.total_cost ?? 0;
      }
    });
    return Array.from(entityMap.values());
  });
  
  // alternative Project with entities array
  // as projectsWithEntities computed
  // BUT: including e fewer entities description fields [id, legal_name, short_name]
  // and keeping track of the "type" from project-entities table
  type SimpleEntity = {
    id: string;
    legal_name: string | null;
    short_name: string | null;
    type: string | null;
    total_cost: number | null;
  };

  // max projectsCount value
  const maxProjectsCount = computed(() => {
    return Math.max(
      ...(entitiesWithProjectsTotalCost.value ?? []).map((entity) => entity.projectsCount)
    );
  });

  const projectsWithSimpleEntities = computed(() => {
    const projectMap = new Map<string, ProjectRow & { entities: SimpleEntity[], entitiesCount: number }>();
    (projectOptions.value ?? []).forEach((project) => {
      projectMap.set(project.id, { ...project, entities: [], entitiesCount: 0 }); 
    });
    (projectEntitiesRows.value ?? []).forEach((pe) => {
      const project = projectMap.get(pe.project_id);
      const entity = entityRows.value?.find((e) => e.id === pe.entity_id);
      
      if (project && entity) {
        project.entities.push({
          id: entity.id,
          legal_name: entity.legal_name,
          short_name: entity.short_name,
          type: pe.type,
          total_cost: pe.total_cost
        });
        project.entitiesCount = project.entities.length;
      }
    });
    return Array.from(projectMap.values());
  });

  function toRiskOrThemeList(value: string | string[] | null | undefined): string[] {
    if (value == null) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return value.split('|').map((s) => s.trim()).filter(Boolean);
  }

    // DATA INDEXES
    // Forward indexes (from single item to collections)
    const projectsByRisk = computed(() => {
        const index = new Map<string, Set<string>>();
        (projectsWithSimpleEntities.value ?? []).forEach((project) => {
            const risks = toRiskOrThemeList(project.risks);
            risks.forEach((riskName) => {
                if (!index.has(riskName)) {
                    index.set(riskName, new Set<string>());
                }
                index.get(riskName)!.add(project.id);
            });
        });
        return index;
    });

    const projectsByTheme = computed(() => {
        const index = new Map<string, Set<string>>();
        (projectsWithSimpleEntities.value ?? []).forEach((project) => {
            const themes = toRiskOrThemeList(project.themes);
            themes.forEach((themeName) => {
                if (!index.has(themeName)) {
                    index.set(themeName, new Set<string>());
                }
                index.get(themeName)!.add(project.id);
            });
        });
        return index;
    });

    const projectsByEntity = computed(() => {
        const index = new Map<string, Set<string>>();
        (entitiesWithProjectsTotalCost.value ?? []).forEach((entity) => {
            entity.projects.forEach((project) => {
                if (!index.has(entity.id)) {
                    index.set(entity.id, new Set<string>());
                }
                index.get(entity.id)!.add(project.id);
            });
        });
        return index;
    });

    const entitiesByRegion = computed(() => {
        const index = new Map<string, Set<string>>();
        (entitiesWithProjectsTotalCost.value ?? []).forEach((entity) => {
            if (entity.related_nuts_code_nuts_code) {
                if (!index.has(entity.related_nuts_code_nuts_code)) {
                    index.set(entity.related_nuts_code_nuts_code, new Set<string>());
                }
                index.get(entity.related_nuts_code_nuts_code)!.add(entity.id);
            }
        });
        return index;
    });

    // Reverse indexes (from projects to collections)
    const entitiesByProject = computed(() => {
        const index = new Map<string, Set<string>>();
        (projectsWithSimpleEntities.value ?? []).forEach((project) => {
            const entityIds = new Set<string>();
            project.entities.forEach((entity) => {
                entityIds.add(entity.id);
            });
            index.set(project.id, entityIds);
        });
        return index;
    });

    const risksByProject = computed(() => {
        const index = new Map<string, Set<string>>();
        (projectsWithSimpleEntities.value ?? []).forEach((project) => {
            const riskNames = new Set<string>(toRiskOrThemeList(project.risks));
            index.set(project.id, riskNames);
        });
        return index;
    });

    const themesByProject = computed(() => {
        const index = new Map<string, Set<string>>();
        (projectsWithSimpleEntities.value ?? []).forEach((project) => {
            const themeNames = new Set<string>(toRiskOrThemeList(project.themes));
            index.set(project.id, themeNames);
        });
        return index;
    });

    // UI variables
    const overedNutsId = ref<string | null>(null);
    const activeNutsId = ref<string | null>(null);
    const showNoGeolocationModal = ref(false);
    const selectedInfoTab = ref('without-geolocation');

    // Entities without geolocation
    const entitiesWithoutGeolocation = computed(() => {
      return (entitiesWithProjectsTotalCost.value ?? []).filter(
        (entity) => !entity.address_geolocation || entity.address_geolocation.trim() === ''
      );
    });

    // Entities without projects
    const entitiesWithoutProjects = computed(() => {
      return (entitiesWithProjectsTotalCost.value ?? []).filter(
        (entity) => (entity.projectsCount ?? 0) === 0
      );
    });

    // Tabs for info modal
    const infoModalTabs = computed(() => [
      {
        label: `Without Geolocation (${entitiesWithoutGeolocation.value.length})`,
        value: 'without-geolocation',
        slot: 'without-geolocation'
      },
      {
        label: `Without Projects (${entitiesWithoutProjects.value.length})`,
        value: 'without-projects',
        slot: 'without-projects'
      }
    ]);

    // Table columns for entities without geolocation
    const noGeolocationColumns = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'legal_name', header: 'Legal Name' },
      { accessorKey: 'short_name', header: 'Short Name' },
      { accessorKey: 'address_country', header: 'Country' },
      { accessorKey: 'projectsCount', header: 'Projects' },
      { accessorKey: 'projectsTotalCost', header: 'Total Cost' },
    ] as any;

    const getNutsNameById = (nutsId: string) => {
        const feature = nuts_shapes.features.find(((f: any) => f.properties.NUTS_ID === nutsId));
        return feature ? feature.properties.NUTS_NAME : 'Unknown';
    };

    // get entities array filtered by nutsId
    const getEntitiesByNutsId = (nutsId: string) => {
        return (entitiesWithProjectsTotalCost.value ?? []).filter((entity) => {
            // Here you would need to have a way to link entities to NUTS regions.
            // This is a placeholder logic assuming entity has a property 'nutsId'
            return entity.related_nuts_code_nuts_code === nutsId; // Placeholder condition
        });
    };

    // for count only
    const overedEntities = computed(() => {
        if (!overedNutsId.value) return [];
        return getEntitiesByNutsId(overedNutsId.value);
    });
  

    const filteredEntities = computed(() => {

        // filtered entities will depend on activeNutsId (or activeNutsIds array)
        // AND from pre-filtered projects (?)

        if (!activeNutsId.value) return [];
        return getEntitiesByNutsId(activeNutsId.value);

    });

    
    // selected and filtered 
    const selectedProjects = ref<string[]>([]);
    const selectedRisks = ref<string[]>([]);
    const selectedThemes = ref<string[]>([]);
    const selectedEntities = ref<string[]>([]);
    const selectedNutsIds = ref<string[]>([]);

    // Toggle functions for selections
    const toggleRisk = (riskName: string) => {
        if (!activeRisks.value.has(riskName)) return; // Don't allow selection of disabled risks
        
        const index = selectedRisks.value.indexOf(riskName);
        if (index > -1) {
            selectedRisks.value.splice(index, 1);
        } else {
            selectedRisks.value.push(riskName);
        }
    };

    const toggleTheme = (themeName: string) => {
        if (!activeThemes.value.has(themeName)) return; // Don't allow selection of disabled themes
        
        const index = selectedThemes.value.indexOf(themeName);
        if (index > -1) {
            selectedThemes.value.splice(index, 1);
        } else {
            selectedThemes.value.push(themeName);
        }
    };

    // Helper functions for set operations
    const intersectSets = (setA: Set<string>, setB: Set<string>): Set<string> => {
        const result = new Set<string>();
        for (const item of setA) {
            if (setB.has(item)) {
                result.add(item);
            }
        }
        return result;
    };

    const unionFromMap = (keys: Set<string>, map: Map<string, Set<string>>): Set<string> => {
        const result = new Set<string>();
        for (const key of keys) {
            const values = map.get(key);
            if (values) {
                for (const value of values) {
                    result.add(value);
                }
            }
        }
        return result;
    };

    const allProjectIds = (): Set<string> => {
        const result = new Set<string>();
        (projectsWithSimpleEntities.value ?? []).forEach((project) => {
            result.add(project.id);
        });
        return result;
    };

    // Convert ref arrays to reactive Sets for easier operations
    const selectedRisksSet = computed(() => new Set(selectedRisks.value));
    const selectedThemesSet = computed(() => new Set(selectedThemes.value));
    const selectedEntitiesSet = computed(() => new Set(selectedEntities.value));
    const selectedNutsIdsSet = computed(() => new Set(selectedNutsIds.value));

    // Active projects based on all selections
    const activeProjects = computed(() => {
        let candidates = allProjectIds();

        if (selectedRisksSet.value.size > 0) {
            candidates = intersectSets(
                candidates,
                unionFromMap(selectedRisksSet.value, projectsByRisk.value)
            );
        }

        if (selectedThemesSet.value.size > 0) {
            candidates = intersectSets(
                candidates,
                unionFromMap(selectedThemesSet.value, projectsByTheme.value)
            );
        }

        if (selectedEntitiesSet.value.size > 0) {
            candidates = intersectSets(
                candidates,
                unionFromMap(selectedEntitiesSet.value, projectsByEntity.value)
            );
        }

        if (selectedNutsIdsSet.value.size > 0) {
            const regionEntities = unionFromMap(
                selectedNutsIdsSet.value,
                entitiesByRegion.value
            );
            candidates = intersectSets(
                candidates,
                unionFromMap(regionEntities, projectsByEntity.value)
            );
        }

        return candidates;
    });

    // Create entity-to-region lookup for activeRegions computation
    const entityToRegion = computed(() => {
        const lookup = new Map<string, string>();
        (entitiesWithProjectsTotalCost.value ?? []).forEach((entity) => {
            if (entity.related_nuts_code_nuts_code) {
                lookup.set(entity.id, entity.related_nuts_code_nuts_code);
            }
        });
        return lookup;
    });

    // Active collections based on filtered projects
    // When no filters are active, show all entities. Otherwise, show only entities from active projects.
    const activeEntities = computed(() => {
        // Check if any filters are active
        const hasFilters = 
            selectedRisksSet.value.size > 0 ||
            selectedThemesSet.value.size > 0 ||
            selectedEntitiesSet.value.size > 0 ||
            selectedNutsIdsSet.value.size > 0;
        
        // If no filters, return all entity IDs
        if (!hasFilters) {
            return new Set((entitiesWithProjectsTotalCost.value ?? []).map(e => e.id));
        }
        
        // Otherwise, return entities from active projects
        return unionFromMap(activeProjects.value, entitiesByProject.value);
    });

    const activeRegions = computed(() => {
        const regions = new Set<string>();
        for (const entityId of activeEntities.value) {
            const region = entityToRegion.value.get(entityId);
            if (region) {
                regions.add(region);
            }
        }
        return regions;
    });

    const activeRisks = computed(() =>
        unionFromMap(activeProjects.value, risksByProject.value)
    );

    const activeThemes = computed(() =>
        unionFromMap(activeProjects.value, themesByProject.value)
    );

    // Filtered lists for display
    const filteredActiveProjects = computed(() => {
        return (projectsWithSimpleEntities.value ?? []).filter(project => 
            activeProjects.value.has(project.id)
        );
    });

</script>
