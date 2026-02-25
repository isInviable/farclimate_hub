<template>
  <div>
    <beta-umap-projects-new
      :projects="projectItems"
      :years="yearsRange"
      :riskCircles="riskItems"
      :themeCircles="themeItems"
    />
  </div>
</template>

<script lang="ts" setup>
import { supabase } from "~/utils/supabase";
import type { EntityRow, ProjectRow, AuxClimateRisk, AuxTheme } from "~/types/cordis";
import * as d3 from "d3";

  const padding = 48;

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

  const projectItems = computed(() =>(projectsWithEntities.value ?? []).map((project) => ({
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
    umapDimensions: fillUmapDimensions(project) 
    }))
  );

  // a function to fill umapDimensions based on risks and themes
  const fillUmapDimensions = (project: any) => {
    const dimensions: number[] = [];
    themeItems.value.forEach((theme) => {
      if (project.themes && project.themes.includes(theme.label)) {
        dimensions.push(1);
      } else {
        dimensions.push(0);
      }
    });
    riskItems.value.forEach((risk) => {
      if (project.risks && project.risks.includes(risk.label)) {
        dimensions.push(1);
      } else {
        dimensions.push(0);
      }
    });
    return dimensions;
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

  // today
  const today = new Date();

  onMounted(() => {
    // print entities
    console.log('Entities:', entityRows.value);
    console.log('Project-Entity Relationships:', projectEntitiesRows.value);
   
  });

</script>

<style>

</style>