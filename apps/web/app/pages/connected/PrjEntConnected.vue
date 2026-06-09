<template>
  <div class="bg-neutral-lightest">
    <CaPageHeader
      n="03"
      kicker="PROJECT–ENTITY CONNECTIONS"
      title="Project–Entity Connections"
      intro="How the work links up. Each project (top) connects to the climate risks it tackles and to the entities and countries that took part. Hover to trace relationships; click a project for full details."
      help-title="Reading the diagram"
      help="Projects run along the top, ordered by start year — bar height shows duration in years. Risks sit in the middle band — bar height shows how many projects address each risk. Entities cluster at the bottom by country and project count; bubble size reflects total funding."
    />

    <div class="mx-auto w-full max-w-[1920px] px-7 py-7 pb-24">
      <div class="relative h-[90vh] min-h-[800px] overflow-hidden bg-neutral-lightest">
        <div v-if="!isChartReady" class="absolute inset-0 flex items-center justify-center">
          <USkeleton class="h-full w-full" />
        </div>

        <div v-else class="absolute inset-0">
          <Connected
            :key="route.path"
            :projects="projectsWithEntities"
            :risks="riskItems"
            :entities="connectedEntities"
            :entity-funding-min="entityFundingMin"
            :entity-funding-max="entityFundingMax"
            @select-project="openProject"
          />
        </div>

        <CaProjectDetailModal v-model:open="isOpen" :project-id="projectId" />

        <!-- section labels (right edge) -->
        <div
          v-if="isChartReady"
          class="pointer-events-none absolute inset-y-0 right-3 z-10 flex w-6 flex-col"
        >
          <span
            class="absolute left-0 font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark [writing-mode:vertical-rl] rotate-180"
            style="top: 7%"
          >
            RISKS
          </span>
          <span
            class="absolute left-0 font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark [writing-mode:vertical-rl] rotate-180"
            style="top: 30%"
          >
            PROJECTS
          </span>
          <span
            class="absolute left-0 font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark [writing-mode:vertical-rl] rotate-180"
            style="top: 68%"
          >
            ENTITIES
          </span>
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

        <!-- bar-height legend -->
        <div
          v-if="isChartReady"
          class="absolute bottom-3 right-3 z-10 border border-neutral-darkest bg-neutral-lightest p-3"
        >
          <span class="mb-2 block font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">BAR HEIGHT</span>
          <div class="flex flex-col gap-2.5">
            <div class="flex items-end gap-2">
              <span class="flex items-end gap-2">
                <span v-for="h in [10, 16, 22]" :key="h" class="relative flex flex-col items-center" :style="{ height: `${h}px` }">
                  <span class="block h-2 w-2 rounded-full border border-neutral-darkest bg-neutral-lightest" />
                  <span class="block w-px flex-1 bg-[#1E63A2]" />
                  <span class="block h-1 w-1 rounded-full bg-[#1E63A2]" />
                </span>
              </span>
              <span class="font-mono text-2xs text-neutral-dark">projects · line length = duration (years)</span>
            </div>
            <div class="flex items-end gap-2">
              <span class="flex items-end gap-2">
                <span v-for="h in [8, 14, 20]" :key="h" class="relative flex flex-col items-center" :style="{ height: `${h}px` }">
                  <span class="block h-2 w-2 rounded-full border border-neutral-darkest bg-neutral-lightest" />
                  <span class="block w-px flex-1 bg-[#1E63A2]" />
                  <span class="block h-1 w-1 rounded-full bg-[#1E63A2]" />
                </span>
              </span>
              <span class="font-mono text-2xs text-neutral-dark">risks · line length = # projects</span>
            </div>
            <div class="flex items-end gap-2">
              <span class="flex items-end gap-1.5">
                <span class="block rounded-full border border-neutral-darkest bg-neutral-lightest" style="width: 6px; height: 6px" />
                <span class="block rounded-full border border-neutral-darkest bg-neutral-lightest" style="width: 11px; height: 11px" />
                <span class="block rounded-full border border-neutral-darkest bg-neutral-lightest" style="width: 16px; height: 16px" />
              </span>
              <span class="font-mono text-2xs text-neutral-dark">entities · funding (√ size)</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="isChartReady && entityFundingBounds.max > entityFundingBounds.min"
        class="mt-4 border border-neutral-darkest bg-neutral-lightest p-4"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">
              ENTITY FUNDING
            </span>
            <span class="mt-0.5 block font-mono text-2xs text-neutral-dark">
              Log scale — finer steps below €1M
            </span>
          </div>
          <span class="font-mono text-[11px] text-neutral-darker">
            {{ formatFunding(entityFundingMin) }} – {{ formatFunding(entityFundingMax) }}
          </span>
        </div>
        <USlider
          v-model="entityFundingLogRange"
          :min="entityFundingBounds.logMin"
          :max="entityFundingBounds.logMax"
          :step="fundingLogStep"
          :min-steps-between-thumbs="1"
          color="neutral"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'connected' });
import type { EntityRow, ProjectRow } from "~/types/cordis";
import { caOrdinalColor } from "~/utils/connectedColors";
import { fundingFromLog, fundingToLog } from "~/utils/entityFundingScale";

const route = useRoute();
const supabase = useSupabaseClient();
const { isOpen, projectId, openProject } = useProjectDetailModal();

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

type ProjectOption = ProjectRow & {
  start_year: number | null;
  end_year: number | null;
  risks: string[] | undefined;
};

type EntityWithProjects = EntityRow & {
  projects: (ProjectOption & { total_cost: number | null })[];
  projectsCount: number;
  projectsTotalCost: number;
};

type ProjectWithEntities = ProjectOption & {
  entities: string[];
  entitiesCount: number;
  countriesIsoArray: string[];
};

type PrjEntConnectedData = {
  projectOptions: ProjectOption[];
  projectEntitiesRows: ProjectEntityRow[];
  entityRows: EntityRow[];
};

const { data: pageData, pending } = await useAsyncData<PrjEntConnectedData>(
  'prj-ent-connected-data',
  async () => {
    const [
      { data: projectsData, error: projectsError },
      { data: projectEntitiesData, error: projectEntitiesError },
      { data: entitiesData, error: entitiesError },
      { data: entityTypes, error: entityTypesError },
    ] = await Promise.all([
      supabase
        .from('projects_cordis')
        .select('id, title, acronym, start_date, end_date, total_cost, duration')
        .order('start_date', { ascending: false }),
      supabase
        .from('project_entities')
        .select('project_id, entity_id, type, entity_order, total_cost, ec_contribution, net_ec_contribution, sme, terminated')
        .order('project_id', { ascending: true }),
      supabase
        .from('entities_cordis')
        .select('id, vat_number, legal_name, short_name, address_country, related_region_iso_code, organization_activity_type_id')
        .order('legal_name'),
      supabase
        .from('aux_entity_types')
        .select('id, name')
        .order('name'),
    ]);

    if (projectsError) throw projectsError;
    if (projectEntitiesError) throw projectEntitiesError;
    if (entitiesError) throw entitiesError;
    if (entityTypesError) throw entityTypesError;

    const projectIds = (projectsData ?? []).map((p) => p.id);
    let riskLinks: { project_id: string; risk_id: number }[] = [];
    let risks: { id: number; name: string }[] = [];

    if (projectIds.length > 0) {
      const [
        { data: riskLinksData, error: riskLinksError },
        { data: risksData, error: risksError },
      ] = await Promise.all([
        supabase
          .from('project_risks')
          .select('project_id, risk_id')
          .in('project_id', projectIds),
        supabase.from('aux_climate_risks').select('id, name'),
      ]);

      if (riskLinksError) throw riskLinksError;
      if (risksError) throw risksError;
      riskLinks = riskLinksData ?? [];
      risks = risksData ?? [];
    }

    const riskNameById = new Map<number, string>();
    risks.forEach((r) => riskNameById.set(r.id, r.name));

    const risksByProject = new Map<string, string[]>();
    riskLinks.forEach((link) => {
      if (!link.project_id || !link.risk_id) return;
      const riskName = riskNameById.get(link.risk_id);
      if (!riskName) return;
      const pid = String(link.project_id);
      if (!risksByProject.has(pid)) risksByProject.set(pid, []);
      risksByProject.get(pid)!.push(riskName);
    });

    const projectOptions: ProjectOption[] = (projectsData ?? []).map((project) => {
      const pid = String(project.id);
      const projectRisks = risksByProject.get(pid) ?? [];
      return {
        ...project,
        risks: projectRisks.length > 0 ? projectRisks : undefined,
        start_year: project.start_date ? new Date(project.start_date).getFullYear() : null,
        end_year: project.end_date ? new Date(project.end_date).getFullYear() : null,
      };
    });

    const entityTypeNameById = new Map<number, string>();
    (entityTypes ?? []).forEach((et) => entityTypeNameById.set(et.id, et.name));

    const entityRows: EntityRow[] = (entitiesData ?? []).map((entity) => ({
      ...entity,
      organization_activity_type_name: entity.organization_activity_type_id
        ? entityTypeNameById.get(entity.organization_activity_type_id) || null
        : null,
    }));

    return {
      projectOptions,
      projectEntitiesRows: (projectEntitiesData ?? []) as ProjectEntityRow[],
      entityRows,
    };
  }
);

const projectOptions = computed(() => pageData.value?.projectOptions ?? []);
const projectEntitiesRows = computed(() => pageData.value?.projectEntitiesRows ?? []);
const entityRows = computed(() => pageData.value?.entityRows ?? []);

const projectById = computed(() => {
  const map = new Map<string, ProjectOption>();
  projectOptions.value.forEach((p) => map.set(p.id, p));
  return map;
});

const connectedEntities = computed<EntityWithProjects[]>(() => {
  const entityById = new Map<string, EntityRow>();
  entityRows.value.forEach((e) => entityById.set(e.id, e));

  const entityMap = new Map<string, EntityWithProjects>();
  const projects = projectById.value;

  projectEntitiesRows.value.forEach((pe) => {
    const entityRow = entityById.get(pe.entity_id);
    const project = projects.get(pe.project_id);
    if (!entityRow || !project) return;

    let entity = entityMap.get(pe.entity_id);
    if (!entity) {
      entity = { ...entityRow, projects: [], projectsCount: 0, projectsTotalCost: 0 };
      entityMap.set(pe.entity_id, entity);
    }
    entity.projects.push({ ...project, total_cost: pe.total_cost });
    entity.projectsCount = entity.projects.length;
    entity.projectsTotalCost += pe.total_cost ?? 0;
  });

  return Array.from(entityMap.values());
});

const projectsWithEntities = computed<ProjectWithEntities[]>(() => {
  const projectMap = new Map<string, ProjectWithEntities>();
  projectOptions.value.forEach((project) => {
    projectMap.set(project.id, { ...project, entities: [], entitiesCount: 0, countriesIsoArray: [] });
  });

  connectedEntities.value.forEach((entity) => {
    entity.projects.forEach((project) => {
      const proj = projectMap.get(project.id);
      if (!proj) return;
      proj.entities.push(entity.id);
      proj.entitiesCount = proj.entities.length;
      if (entity.related_region_iso_code && !proj.countriesIsoArray.includes(entity.related_region_iso_code)) {
        proj.countriesIsoArray.push(entity.related_region_iso_code);
      }
    });
  });

  return Array.from(projectMap.values());
});

const riskItems = computed(() => {
  const map = new Map<string, number>();
  projectOptions.value.forEach((project) => {
    (project.risks ?? []).forEach((risk) => {
      map.set(risk, (map.get(risk) || 0) + 1);
    });
  });
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([risk, count]) => ({ risk, count }));
});

const isChartReady = computed(
  () => !pending.value && projectsWithEntities.value.length > 0
);

const entityTypeLegend = computed(() => {
  const counts = new Map<string, number>();
  connectedEntities.value.forEach((e) => {
    const t = e.organization_activity_type_name;
    if (t) counts.set(t, (counts.get(t) || 0) + 1);
  });
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([type]) => type);
  const color = caOrdinalColor(sorted);
  return sorted.map((type) => ({ type, color: color(type) }));
});

const entityFundingBounds = computed(() => {
  const costs = connectedEntities.value.map((e) => e.projectsTotalCost);
  if (!costs.length) return { min: 0, max: 0, logMin: 0, logMax: 0 };
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  return { min, max, logMin: fundingToLog(min), logMax: fundingToLog(max) };
});

const entityFundingLogRange = ref<[number, number]>([0, 0]);

const entityFundingMin = computed(() => fundingFromLog(entityFundingLogRange.value[0]));
const entityFundingMax = computed(() => fundingFromLog(entityFundingLogRange.value[1]));

watch(
  entityFundingBounds,
  ({ logMin, logMax }) => {
    entityFundingLogRange.value = [logMin, logMax];
  },
  { immediate: true }
);

const fundingLogStep = computed(() => {
  const span = entityFundingBounds.value.logMax - entityFundingBounds.value.logMin;
  if (span <= 0) return 0.01;
  return Math.max(0.01, span / 150);
});

function formatFunding(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.round(value));
}
</script>
