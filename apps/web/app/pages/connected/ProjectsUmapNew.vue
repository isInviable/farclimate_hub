<template>
  <div class="bg-neutral-lightest">
    <CaPageHeader
      n="04"
      kicker="PROJECTS UMAP"
      title="Projects UMAP"
      intro="Projects placed in 2-D semantic space from the climate risks or themes they address — switch view below. Projects that sit close together share similar categories; hover a legend item to highlight its cluster and fade the rest."
      help-title="Reading the plot"
      help="Position comes from a UMAP projection of the active view (risks or themes) — axes have no units. Bubble size reflects funding relative to duration; the stacked shadow scales with the number of participating entities."
    />

    <div class="mx-auto w-full max-w-[1920px] px-7 py-7 pb-24">
      <div class="relative h-[82vh] min-h-[680px] overflow-hidden border border-neutral-darkest bg-neutral-lightest">
        <div class="absolute inset-0">
          <UmapProjectsNew
            :projects="projectItems"
            :years="yearsRange"
            :risk-circles="riskItems"
            :theme-circles="themeItems"
            :category-mode="categoryMode"
            :active-category="activeCategory"
            @select-project="openProject"
          />
        </div>

        <CaProjectDetailModal v-model:open="isOpen" :project-id="projectId" />

        <!-- bubble-size legend -->
        <div class="absolute bottom-3 left-3 z-10 border border-neutral-darkest bg-neutral-lightest p-3">
          <span class="mb-2 block font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">BUBBLE SIZE = FUNDING</span>
          <div class="flex items-end gap-3">
            <span v-for="b in [6, 11, 16]" :key="b" class="flex flex-col items-center gap-1">
              <span class="block rounded-full border-2 border-neutral-darkest bg-neutral-lightest" :style="{ width: `${b * 2}px`, height: `${b * 2}px` }" />
            </span>
            <span class="font-mono text-2xs text-neutral-dark">low → high</span>
          </div>
        </div>

        <!-- category clusters (floating panel) -->
        <div class="absolute right-3 top-3 z-10 max-h-[calc(100%-24px)] w-[280px] overflow-y-auto border border-neutral-darkest bg-neutral-lightest">
          <div class="flex border-b border-neutral-darkest">
            <button
              type="button"
              class="flex-1 border-r border-neutral-darkest px-3 py-2.5 font-mono text-2xs font-bold tracking-[0.12em] transition-colors"
              :class="categoryMode === 'risks' ? 'bg-neutral-darkest text-neutral-lightest' : 'text-neutral-dark hover:bg-neutral-lighter'"
              @click="setCategoryMode('risks')"
            >
              RISKS
            </button>
            <button
              type="button"
              class="flex-1 px-3 py-2.5 font-mono text-2xs font-bold tracking-[0.12em] transition-colors"
              :class="categoryMode === 'themes' ? 'bg-neutral-darkest text-neutral-lightest' : 'text-neutral-dark hover:bg-neutral-lighter'"
              @click="setCategoryMode('themes')"
            >
              THEMES
            </button>
          </div>
          <header class="flex items-center gap-2 border-b border-neutral-darkest px-4 py-3">
            <span class="font-mono text-xs font-bold tracking-[0.06em]">{{ legendTitle }}</span>
            <CaHelp title="Clusters" align="right" :w="260">
              {{ legendHelp }}
            </CaHelp>
          </header>
          <ul class="flex flex-col gap-2 p-4">
            <li
              v-for="item in legendItems"
              :key="item.value"
              class="flex cursor-pointer items-center gap-2.5 transition-opacity"
              :class="pinnedCategory && pinnedCategory !== item.label ? 'opacity-40' : ''"
              @mouseenter="activeCategory = item.label"
              @mouseleave="activeCategory = pinnedCategory"
              @click="togglePinnedCategory(item.label)"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-full border-2 border-dashed transition-colors"
                :class="activeCategory === item.label ? 'border-trust-blue bg-trust-blue-light/40' : 'border-neutral-dark'"
              />
              <span class="font-mono text-[11px] text-neutral-darkest">{{ item.label }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
definePageMeta({ layout: 'connected' });
import type { EntityRow, ProjectRow, AuxClimateRisk, AuxTheme } from "~/types/cordis";
import * as d3 from "d3";

  const supabase = useSupabaseClient();

  const padding = 48;

  type CategoryMode = 'risks' | 'themes';

  const { isOpen, projectId, openProject } = useProjectDetailModal();

  const categoryMode = ref<CategoryMode>('risks');
  const activeCategory = ref<string | null>(null);
  const pinnedCategory = ref<string | null>(null);

  const setCategoryMode = (mode: CategoryMode) => {
    if (categoryMode.value === mode) return;
    categoryMode.value = mode;
    activeCategory.value = null;
    pinnedCategory.value = null;
  };

  const togglePinnedCategory = (label: string) => {
    pinnedCategory.value = pinnedCategory.value === label ? null : label;
    activeCategory.value = pinnedCategory.value;
  };

  const legendItems = computed(() =>
    categoryMode.value === 'risks' ? riskItems.value : themeItems.value
  );

  const legendTitle = computed(() =>
    categoryMode.value === 'risks' ? 'CLIMATE-RISK CLUSTERS' : 'THEME CLUSTERS'
  );

  const legendHelp = computed(() =>
    categoryMode.value === 'risks'
      ? 'Soft dashed rings show all risk clusters. Hover a risk below to emphasize its ring and fade non-matching projects; click to pin.'
      : 'Soft dashed rings show all theme clusters. Hover a theme below to emphasize its ring and fade non-matching projects; click to pin.'
  );

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

  // ProjectOption type with computed fields (extends ProjectRow)
  type ProjectOption = ProjectRow & {
    risks: string[] | undefined;
    themes: string[] | undefined;
  };

  // Fetch projects from Supabase (with risks/themes computed from junction tables as arrays)
  const {
    data: projectOptions,
    pending: loadingProjects,
    error: projectsError
  } = await useAsyncData('project-options', async () => {
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
    
    // Build risks and themes arrays by project_id
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
    
    // Transform projects with computed risks/themes as arrays
    return (projectsData ?? []).map((project: any) => {
      const pid = String(project.id);
      const projectRisks = risksByProject.get(pid) ?? [];
      const projectThemes = themesByProject.get(pid) ?? [];
      
      return {
        ...project,
        risks: projectRisks.length > 0 ? projectRisks : undefined,
        themes: projectThemes.length > 0 ? projectThemes : undefined,
      } as ProjectOption;
    });
  });

  // Fetch entities from Supabase (using shared EntityRow type)
  const { data: entityRows, pending: loadingEntities, error: entitiesError } = await useAsyncData(
    'relationship-entities',
    async () => {
      const { data, error } = await supabase
        .from('entities_cordis')
        .select('id, vat_number, legal_name, short_name, address_country, related_region_iso_code')
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
  } = await useAsyncData('relationship-project-entities', async () => {
    const { data, error } = await supabase
      .from('project_entities')
      .select('project_id, entity_id, type, entity_order, total_cost, ec_contribution, net_ec_contribution, sme, terminated')
      .order('project_id', { ascending: true });
    
    if (error) throw error;
    return (data ?? []) as ProjectEntityRow[];
  });

  // Fetch risk options from Supabase (using shared type AuxClimateRisk)
  const { data: riskOptions, pending: loadingRisks, error: riskError } = await useAsyncData(
    'risk-options',
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
    'theme-options',
    async () => {
      const { data, error } = await supabase
        .from('aux_themes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return (data ?? []) as AuxTheme[];
    }
  );
 
  // Enhanced project options with entities
  const projectsWithEntities = computed(() => {
    if (!projectOptions.value || !projectEntitiesRows.value) return [];
    
    return projectOptions.value.map((project) => {
      // Find all entities for this project
      const projectEntities = projectEntitiesRows.value?.filter(pe => pe.project_id === project.id) || [];
      const entities = projectEntities.map(pe => pe.entity_id);
      
      return {
        ...project,
        entities: entities,
        entitiesCount: entities.length
      };
    });
  });

  const riskItems = computed(() =>
  (riskOptions.value ?? []).map((risk) => ({
      label: risk.name,
      value: risk.id
    }))
  );

  const themeItems = computed(() =>
  (themeOptions.value ?? []).map((theme) => ({
      label: theme.name,
      value: theme.id
    }))
  );

  const projectItems = computed(() => (projectsWithEntities.value ?? []).map((project) => ({
    id: project.id,
    label: project.title ?? project.id,
    value: project.id,
    description: project.acronym ?? undefined,
    startDate: project.start_date ?? undefined,
    endDate: project.end_date ?? undefined,
    totalCost: project.total_cost ?? undefined,
    duration: project.duration ?? undefined,
    risks: project.risks ?? undefined,
    themes: project.themes ?? undefined,
    entities: project.entities,
    entitiesCount: project.entitiesCount,
    umapDimensions: fillUmapDimensions(project, categoryMode.value),
  })));

  const fillUmapDimensions = (project: any, mode: CategoryMode) => {
    const items = mode === 'risks' ? riskItems.value : themeItems.value;
    const values = mode === 'risks' ? project.risks : project.themes;
    return items.map((item) => (values?.includes(item.label) ? 1 : 0));
  };

  // min and max dates
  const minDate = computed(() => {
    return d3.min(
      (projectsWithEntities.value ?? []).map((project) =>
        project.start_date ? new Date(project.start_date) : new Date()
      )
    );
  });

  const maxDate = computed(() => {
    return d3.max(
      (projectsWithEntities.value ?? []).map((project) =>
        project.end_date ? new Date(project.end_date) : new Date()
      )
    );
  });

  // an arrayy of years from min to max date
  const yearsRange = computed(() => {
    const years = [];
    if (minDate.value && maxDate.value) {
      for (let year = minDate.value.getFullYear(); year <= maxDate.value.getFullYear(); year++) {
        years.push(year);
      }
    }
    return years;
  });

</script>

<style>

</style>