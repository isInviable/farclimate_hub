<template>

  <div class="bg-neutral-lightest">
    <CaPageHeader
      n="03"
      kicker="PROJECT–ENTITY CONNECTIONS"
      title="Project–Entity Connections"
      intro="How the work links up. Each project (top) connects to the climate risks it tackles and to the entities and countries that took part. Hover a project, risk or country to trace its relationships."
      help-title="Reading the diagram"
      help="Projects run along the top, ordered by start year; risks sit in the middle band; entities are clustered at the bottom by country and by how many projects they join. Bubble size reflects total funding."
    />

    <div class="mx-auto w-full max-w-[1920px] px-7 py-7 pb-24">
      <div class="relative h-[82vh] min-h-[680px] overflow-hidden border border-neutral-darkest bg-neutral-lightest">
        <div class="absolute inset-0">
          <Connected
            :projects="projectsWithEntities || []"
            :risks="Array.from(riskCountMap.entries()).map(([risk, count]) => ({ risk, count }))"
            :entities="entitiesWithProjectsTotalCost || []"
          />
        </div>

        <!-- entity-type legend -->
        <div
          v-if="entityTypeLegend.length"
          class="absolute bottom-3 left-3 z-10 border border-neutral-darkest bg-neutral-lightest p-3"
        >
          <span class="mb-2 block font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">ENTITY TYPE</span>
          <ul class="flex flex-col gap-1.5">
            <li v-for="item in entityTypeLegend" :key="item.type" class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 shrink-0" :style="{ backgroundColor: item.color }" />
              <span class="font-mono text-[11px] text-neutral-darkest">{{ item.type }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'connected' });
import type { EntityRow, ProjectRow, AuxClimateRisk } from "~/types/cordis";
import { caOrdinalColor } from "~/utils/connectedColors";

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

  // ProjectOption type with computed fields (extends ProjectRow)
  type ProjectOption = ProjectRow & {
    start_year: number | null;
    end_year: number | null;
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
    
    // Transform projects with computed risks/themes as arrays and add computed year fields
    return (projectsData ?? []).map((project: ProjectRow) => {
      const pid = String(project.id);
      const projectRisks = risksByProject.get(pid) ?? [];
      const projectThemes = themesByProject.get(pid) ?? [];
      
      return {
        ...project,
        risks: projectRisks.length > 0 ? projectRisks : undefined,
        themes: projectThemes.length > 0 ? projectThemes : undefined,
        start_year: project.start_date ? new Date(project.start_date).getFullYear() : null,
        end_year: project.end_date ? new Date(project.end_date).getFullYear() : null,
      } as ProjectOption;
    });
  });

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

  // a computed function to get risk count from projects risk array
  const riskCountMap = computed(() => {
    const map = new Map<string, number>();
    (projectOptions.value ?? []).forEach((project) => {
      (project.risks ?? []).forEach((risk: string) => {
        map.set(risk, (map.get(risk) || 0) + 1);
      });
    });
    const sortedMap = new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
    return sortedMap;
  });

  // Fetch entities from Supabase with organization activity type name
  const { data: entityRows, pending: loadingEntities, error: entitiesError } = await useAsyncData(
    'relationship-entities',
    async () => {
      // Fetch entities and entity types in parallel
      const [
        { data: entitiesData, error: entitiesError },
        { data: entityTypes, error: entityTypesError },
      ] = await Promise.all([
        supabase
          .from('entities_cordis')
          .select('id, vat_number, legal_name, short_name, address_country, related_region_iso_code, organization_activity_type_id')
          .order('legal_name'),
        supabase
          .from('aux_entity_types')
          .select('id, name')
          .order('name'),
      ]);
      
      if (entitiesError) throw entitiesError;
      if (entityTypesError) throw entityTypesError;
      
      // Create lookup map for entity type names
      const entityTypeNameById = new Map<number, string>();
      (entityTypes ?? []).forEach((et: any) => {
        entityTypeNameById.set(et.id, et.name);
      });
      
      // Add organization_activity_type_name to entities
      return (entitiesData ?? []).map((entity: any) => ({
        ...entity,
        organization_activity_type_name: entity.organization_activity_type_id
          ? entityTypeNameById.get(entity.organization_activity_type_id) || null
          : null,
      }));
    }
  );

  const entitiesWithProjectsTotalCost = computed(() => {
    const entityMap = new Map<string, EntityRow & { projects: (ProjectOption & { total_cost: number | null })[], projectsCount: number, projectsTotalCost: number }>();
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

  // a computed function that add an array of entities to each project
  const projectsWithEntities = computed(() => {
    const projectMap = new Map<string, ProjectOption & { entities: string[], entitiesCount: number, countriesIsoArray: string[] }>();
    (projectOptions.value ?? []).forEach((project) => {
      projectMap.set(project.id, { ...project, entities: [], entitiesCount: 0, countriesIsoArray: [] });
    });
    (entitiesWithProjectsTotalCost.value ?? []).forEach((entity) => {
      entity.projects.forEach((project) => {
        const proj = projectMap.get(project.id);
        if (proj) {
          proj.entities.push(entity.id);
          proj.entitiesCount = proj.entities.length;
          
          // Add unique related_region_iso_code if it exists and isn't already in the array
          if (entity.related_region_iso_code && !proj.countriesIsoArray.includes(entity.related_region_iso_code)) {
            proj.countriesIsoArray.push(entity.related_region_iso_code);
          }
        }
      });
    });
    return Array.from(projectMap.values());
  });

  // Entity-type legend — order/colour must mirror the ordinal scale used inside
  // <Connected> (domain sorted by descending count, range = brand palette).
  const entityTypeLegend = computed(() => {
    const counts = new Map<string, number>();
    (entityRows.value ?? []).forEach((e: any) => {
      const t = e.organization_activity_type_name;
      if (t) counts.set(t, (counts.get(t) || 0) + 1);
    });
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([type]) => type);
    const color = caOrdinalColor(sorted);
    return sorted.map((type) => ({ type, color: color(type) }));
  });

</script>

<style>

</style>