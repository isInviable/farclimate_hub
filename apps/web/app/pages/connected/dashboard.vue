<script setup lang="ts">
definePageMeta({ layout: 'connected' });

import { CONNECTED_CORDIS_KEYS } from "~/composables/useConnectedCordisData";
import {
  fetchProjectsTable,
  fetchEntitiesTable,
  fetchProductsTable,
  fetchProjectEntitiesTable,
  fetchProjectRisksTable,
  fetchProjectThemesTable,
  fetchAuxClimateRisks,
  fetchAuxThemes,
} from "~/utils/cordisRepository";

// Filter types
const FILTER_TYPES = {
  none: "none",
  country: "country",
  risk: "risk",
  topic: "topic",
  year: "year",
};

function formatInvestment(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.round(value));
}

// Fetch all data
const { data: rawProjects } = await useAsyncData(CONNECTED_CORDIS_KEYS.projects, fetchProjectsTable);
const { data: rawEntities } = await useAsyncData(CONNECTED_CORDIS_KEYS.entities, fetchEntitiesTable);
const { data: rawProducts } = await useAsyncData(CONNECTED_CORDIS_KEYS.products, fetchProductsTable);
const { data: rawProjectEntities } = await useAsyncData(CONNECTED_CORDIS_KEYS.projectEntities, fetchProjectEntitiesTable);
const { data: rawProjectRisks } = await useAsyncData(CONNECTED_CORDIS_KEYS.projectRisks, fetchProjectRisksTable);
const { data: rawProjectThemes } = await useAsyncData(CONNECTED_CORDIS_KEYS.projectThemes, fetchProjectThemesTable);
const { data: rawRisks } = await useAsyncData(CONNECTED_CORDIS_KEYS.risks, fetchAuxClimateRisks);
const { data: rawThemes } = await useAsyncData(CONNECTED_CORDIS_KEYS.themes, fetchAuxThemes);

// Process base data
const processedDataBase = computed(() => {
  const projects = (rawProjects.value || []).map((p: any) => ({
    id: p.id,
    cordis_id: p.cordis_id,
    title: p.title,
    acronym: p.acronym,
    startDate: p.start_date,
    endDate: p.end_date,
    totalCost: p.total_cost || 0,
    ecMaxContribution: p.ec_max_contribution || 0,
    year: p.start_date ? parseInt(p.start_date.substring(0, 4)) : null,
  }));

  const entities = (rawEntities.value || []).map((e: any) => ({
    id: e.id,
    cordis_id: e.cordis_id,
    address_url: e.address_url || null,
    country: e.address_country || "Unknown",
    legal_name: e.legal_name,
    short_name: e.short_name,
    address_country: e.address_country,
  }));

  return {
    projects,
    entities,
    products: rawProducts.value || [],
    projectEntities: rawProjectEntities.value || [],
    projectRisks: rawProjectRisks.value || [],
    projectThemes: rawProjectThemes.value || [],
    risks: rawRisks.value || [],
    themes: rawThemes.value || [],
  };
});

// Filter state
const activeFilter = ref({
  filterType: FILTER_TYPES.none,
  content: "",
  label: "",
});

const yearRange = ref({
  min: 2010,
  max: 2025,
});

const hasFilteredData = computed(() => activeFilter.value.filterType !== FILTER_TYPES.none);

const topicChartScopeHint = computed(() => {
  if (!hasFilteredData.value) return "";
  const { filterType, label } = activeFilter.value;
  if (filterType === FILTER_TYPES.topic) {
    return `Dark bar: projects tagged “${label}” · Gray: all projects`;
  }
  if (filterType === FILTER_TYPES.country) {
    return `Dark bar: topics on projects with ${label} institutions · Gray: all projects`;
  }
  if (filterType === FILTER_TYPES.risk) {
    return `Dark bar: projects addressing “${label}” by topic · Gray: all projects`;
  }
  if (filterType === FILTER_TYPES.year) {
    return `Dark bar: topics on projects starting in ${label} · Gray: all projects`;
  }
  return "";
});

const riskChartScopeHint = computed(() => {
  if (!hasFilteredData.value) return "";
  const { filterType, label } = activeFilter.value;
  if (filterType === FILTER_TYPES.risk) {
    return `Dark bar: co-risks on projects addressing “${label}” · Gray: all projects`;
  }
  if (filterType === FILTER_TYPES.country) {
    return `Dark bar: risks on projects with ${label} institutions · Gray: all projects`;
  }
  if (filterType === FILTER_TYPES.topic) {
    return `Dark bar: co-risks on projects tagged “${label}” · Gray: all projects`;
  }
  if (filterType === FILTER_TYPES.year) {
    return `Dark bar: risks on projects starting in ${label} · Gray: all projects`;
  }
  return "";
});

const mapChartTitle = computed(() => {
  const { filterType } = activeFilter.value;
  if (
    filterType === FILTER_TYPES.risk ||
    filterType === FILTER_TYPES.topic ||
    filterType === FILTER_TYPES.year
  ) {
    return "Projects per Country";
  }
  return "Entities per Country";
});

const mapChartScopeHint = computed(() => {
  if (!hasFilteredData.value) return "";
  const { filterType, label } = activeFilter.value;
  if (filterType === FILTER_TYPES.country) {
    return `Dark bar: ${label} institutions · Gray: all institutions`;
  }
  if (filterType === FILTER_TYPES.risk) {
    return `Dark bar: projects addressing “${label}” per country · Gray: all projects per country`;
  }
  if (filterType === FILTER_TYPES.topic) {
    return `Dark bar: projects tagged “${label}” per country · Gray: all projects per country`;
  }
  if (filterType === FILTER_TYPES.year) {
    return `Dark bar: projects starting in ${label} per country · Gray: all projects per country`;
  }
  return "";
});

function entityIdsForProjects(
  projectIds: Set<string>,
  projectEntities: { projectId: string; entityId: string }[]
) {
  return new Set(
    projectEntities
      .filter((pe) => projectIds.has(pe.projectId))
      .map((pe) => pe.entityId)
  );
}

function filterProjectsByActiveFilter(projects: typeof processedDataBase.value.projects) {
  const base = processedDataBase.value;
  const { filterType, content } = activeFilter.value;

  if (filterType === FILTER_TYPES.country) {
    const entityIdsInCountry = new Set(
      base.entities.filter((e) => e.country === content).map((e) => e.id)
    );
    const projectIds = new Set(
      base.projectEntities
        .filter((pe) => entityIdsInCountry.has(pe.entityId))
        .map((pe) => pe.projectId)
    );
    return projects.filter((p) => projectIds.has(p.id));
  }

  if (filterType === FILTER_TYPES.risk) {
    const riskId = parseInt(content);
    const projectIds = new Set(
      base.projectRisks
        .filter((pr: { riskId: number }) => pr.riskId === riskId)
        .map((pr: { projectId: string }) => pr.projectId)
    );
    return projects.filter((p) => projectIds.has(p.id));
  }

  if (filterType === FILTER_TYPES.topic) {
    const themeId = parseInt(content);
    const projectIds = new Set(
      base.projectThemes
        .filter((pt: { themeId: number }) => pt.themeId === themeId)
        .map((pt: { projectId: string }) => pt.projectId)
    );
    return projects.filter((p) => projectIds.has(p.id));
  }

  if (filterType === FILTER_TYPES.year) {
    const year = parseInt(content);
    return projects.filter((p) => p.year === year);
  }

  return projects;
}

// Processed data with filters applied
const processedData = computed(() => {
  const base = processedDataBase.value;

  let projects = base.projects.filter(
    (p) => p.year && p.year >= yearRange.value.min && p.year <= yearRange.value.max
  );

  if (activeFilter.value.filterType !== FILTER_TYPES.none) {
    projects = filterProjectsByActiveFilter(projects);
    const projectIds = new Set(projects.map((p) => p.id));
    const entityIds = entityIdsForProjects(projectIds, base.projectEntities);

    const entities =
      activeFilter.value.filterType === FILTER_TYPES.country
        ? base.entities.filter(
            (e) =>
              e.country === activeFilter.value.content && entityIds.has(e.id)
          )
        : base.entities.filter((e) => entityIds.has(e.id));

    return { projects, entities, products: base.products };
  }

  return {
    projects,
    entities: base.entities,
    products: base.products,
  };
});

function countriesOnProject(projectId: string, base: any) {
  const countries = new Set<string>();
  for (const pe of base.projectEntities) {
    if (pe.projectId !== projectId) continue;
    const entity = base.entities.find((e: { id: string }) => e.id === pe.entityId);
    if (entity?.country) countries.add(entity.country);
  }
  return countries;
}

function countProjectsByCountry(projects: { id: string }[], base: any) {
  const byCountry = new Map<string, Set<string>>();
  for (const project of projects) {
    for (const country of countriesOnProject(project.id, base)) {
      if (!byCountry.has(country)) byCountry.set(country, new Set());
      byCountry.get(country)!.add(project.id);
    }
  }
  const counts = new Map<string, number>();
  byCountry.forEach((projectIds, country) => {
    counts.set(country, projectIds.size);
  });
  return counts;
}

function countThemesOnProjects(projects: { id: string }[], base: any) {
  const projectIds = new Set(projects.map((p) => p.id));
  const byTheme = new Map<number, Set<string>>();
  for (const pt of base.projectThemes) {
    if (!projectIds.has(pt.projectId)) continue;
    if (!byTheme.has(pt.themeId)) byTheme.set(pt.themeId, new Set());
    byTheme.get(pt.themeId)!.add(pt.projectId);
  }
  const counts = new Map<number, number>();
  byTheme.forEach((ids, themeId) => counts.set(themeId, ids.size));
  return counts;
}

function countRisksOnProjects(projects: { id: string }[], base: any) {
  const projectIds = new Set(projects.map((p) => p.id));
  const byRisk = new Map<number, Set<string>>();
  for (const pr of base.projectRisks) {
    if (!projectIds.has(pr.projectId)) continue;
    if (!byRisk.has(pr.riskId)) byRisk.set(pr.riskId, new Set());
    byRisk.get(pr.riskId)!.add(pr.projectId);
  }
  const counts = new Map<number, number>();
  byRisk.forEach((ids, riskId) => counts.set(riskId, ids.size));
  return counts;
}

function projectIdsWithRisk(base: any, riskId: number) {
  return new Set(
    base.projectRisks
      .filter((pr: { riskId: number }) => pr.riskId === riskId)
      .map((pr: { projectId: string }) => pr.projectId)
  );
}

function projectIdsWithTheme(base: any, themeId: number) {
  return new Set(
    base.projectThemes
      .filter((pt: { themeId: number }) => pt.themeId === themeId)
      .map((pt: { projectId: string }) => pt.projectId)
  );
}

function projectsForSelectedFilter(
  base: any,
  filteredProjects: { id: string }[],
  filterType: string,
  content: string
) {
  if (filterType === FILTER_TYPES.risk) {
    const riskIds = projectIdsWithRisk(base, parseInt(content, 10));
    return filteredProjects.filter((p) => riskIds.has(p.id));
  }
  if (filterType === FILTER_TYPES.topic) {
    const themeIds = projectIdsWithTheme(base, parseInt(content, 10));
    return filteredProjects.filter((p) => themeIds.has(p.id));
  }
  return filteredProjects;
}

// Dashboard data structures
const dataForDashboard = computed(() => {
  const base = processedDataBase.value;
  const filtered = processedData.value;
  const { filterType, content } = activeFilter.value;

  const entitiesByCountry = new Map<string, number>();
  base.entities.forEach((e: any) => {
    const country = e.country || "Unknown";
    entitiesByCountry.set(country, (entitiesByCountry.get(country) || 0) + 1);
  });

  const projectsByCountry = countProjectsByCountry(base.projects, base);
  const projectsByTheme = countThemesOnProjects(base.projects, base);
  const projectsByRisk = countRisksOnProjects(base.projects, base);

  let countryFiltered = new Map<string, number>();
  let projectsByThemeFiltered = new Map<number, number>();
  let projectsByRiskFiltered = new Map<number, number>();

  const useProjectCountsForCountry =
    filterType === FILTER_TYPES.risk ||
    filterType === FILTER_TYPES.topic ||
    filterType === FILTER_TYPES.year;

  if (filterType === FILTER_TYPES.country) {
    filtered.entities.forEach((e: any) => {
      const country = e.country || "Unknown";
      countryFiltered.set(country, (countryFiltered.get(country) || 0) + 1);
    });
    projectsByThemeFiltered = countThemesOnProjects(filtered.projects, base);
    projectsByRiskFiltered = countRisksOnProjects(filtered.projects, base);
  } else if (filterType !== FILTER_TYPES.none) {
    const scopedProjects = projectsForSelectedFilter(
      base,
      filtered.projects,
      filterType,
      content
    );

    if (useProjectCountsForCountry) {
      countryFiltered = countProjectsByCountry(scopedProjects, base);
    }

    // Cross-charts: attribute topics/countries only through the selected filter.
    projectsByThemeFiltered = countThemesOnProjects(scopedProjects, base);

    // Risk chart: show co-risks on the scoped project set.
    projectsByRiskFiltered = countRisksOnProjects(scopedProjects, base);
  }

  // Projects per year
  const projectsByYear = new Map<number, number>();
  base.projects.forEach((p: any) => {
    if (p.year) {
      projectsByYear.set(p.year, (projectsByYear.get(p.year) || 0) + 1);
    }
  });

  const projectsByYearFiltered = new Map<number, number>();
  filtered.projects.forEach((p: any) => {
    if (p.year) {
      projectsByYearFiltered.set(
        p.year,
        (projectsByYearFiltered.get(p.year) || 0) + 1
      );
    }
  });

  // Investment per year
  const investmentByYear = new Map<number, number>();
  base.projects.forEach((p: any) => {
    if (p.year && p.totalCost) {
      investmentByYear.set(
        p.year,
        (investmentByYear.get(p.year) || 0) + p.totalCost
      );
    }
  });

  const investmentByYearFiltered = new Map<number, number>();
  filtered.projects.forEach((p: any) => {
    if (p.year && p.totalCost) {
      investmentByYearFiltered.set(
        p.year,
        (investmentByYearFiltered.get(p.year) || 0) + p.totalCost
      );
    }
  });

  const countryKeys = new Set<string>([
    ...entitiesByCountry.keys(),
    ...projectsByCountry.keys(),
    ...countryFiltered.keys(),
  ]);

  const entitiesByCountryData = Array.from(countryKeys).map((country) => ({
    id: country,
    label: country,
    count: useProjectCountsForCountry
      ? projectsByCountry.get(country) || 0
      : entitiesByCountry.get(country) || 0,
    count_f: countryFiltered.get(country) || 0,
  }));

  return {
    entitiesByCountry: entitiesByCountryData,
    projectsByTheme: base.themes.map((theme: any) => ({
      id: theme.id,
      label: theme.name,
      count: projectsByTheme.get(theme.id) || 0,
      count_f: projectsByThemeFiltered.get(theme.id) || 0,
    })),
    projectsByRisk: base.risks.map((risk: any) => ({
      id: risk.id,
      label: risk.name,
      count: projectsByRisk.get(risk.id) || 0,
      count_f: projectsByRiskFiltered.get(risk.id) || 0,
    })),
    projectsByYear: Array.from(
      new Set([...projectsByYear.keys(), ...projectsByYearFiltered.keys()])
    )
      .sort()
      .map((year) => ({
        label: year,
        count: projectsByYear.get(year) || 0,
        count_f: projectsByYearFiltered.get(year) || 0,
      })),
    investmentByYear: Array.from(
      new Set([...investmentByYear.keys(), ...investmentByYearFiltered.keys()])
    )
      .sort()
      .map((year) => ({
        label: year,
        count: investmentByYear.get(year) || 0,
        count_f: investmentByYearFiltered.get(year) || 0,
      })),
  };
});

// Computed data for charts
const dataForEntitiesByCountry = computed(() => {
  return dataForDashboard.value.entitiesByCountry
    .sort((a, b) => b.count - a.count)
    .map((d) => ({
      ...d,
      count_f: d.count_f || 0,
    }));
});

const dataForProjectsByTheme = computed(() => {
  const isTopicFilter = activeFilter.value.filterType === FILTER_TYPES.topic;
  const selectedThemeId = isTopicFilter
    ? parseInt(activeFilter.value.content, 10)
    : null;

  return dataForDashboard.value.projectsByTheme
    .sort((a, b) => b.count - a.count)
    .map((d) => ({
      ...d,
      // On the topic chart, only the selected topic gets a dark bar (avoid co-tag noise).
      count_f:
        isTopicFilter && d.id !== selectedThemeId ? 0 : d.count_f || 0,
    }));
});

const dataForProjectsByRisk = computed(() => {
  return dataForDashboard.value.projectsByRisk
    .sort((a, b) => b.count - a.count)
    .map((d) => ({
      ...d,
      count_f: d.count_f || 0,
    }));
});

const dataForProjectsByYear = computed(() => {
  return dataForDashboard.value.projectsByYear.map((d) => ({
    ...d,
    count_f: d.count_f || 0,
  }));
});

const dataForInvestmentByYear = computed(() => {
  return dataForDashboard.value.investmentByYear.map((d) => ({
    ...d,
    count_f: d.count_f || 0,
  }));
});

// Projects evolution by topic (per year)
const dataForProjectsEvolutionByTopic = computed(() => {
  const base = processedDataBase.value;
  const filtered = processedData.value;

  // Get all years
  const allYears = new Set<number>();
  base.projects.forEach((p: any) => {
    if (p.year) allYears.add(p.year);
  });
  const sortedYears = Array.from(allYears).sort((a, b) => a - b);

  // For each theme, count projects per year
  return base.themes.map((theme: any) => {
    const yearsData = new Map<number, number>();

    // Initialize all years with 0
    sortedYears.forEach((year) => {
      yearsData.set(year, 0);
    });

    // Count projects for this theme per year (base data)
    base.projects.forEach((p: any) => {
      if (p.year) {
        const themes = base.projectThemes.filter((pt: any) => pt.projectId === p.id);
        const hasTheme = themes.some((pt: any) => pt.themeId === theme.id);
        if (hasTheme) {
          yearsData.set(p.year, (yearsData.get(p.year) || 0) + 1);
        }
      }
    });

    // Count filtered projects for this theme per year
    const yearsDataFiltered = new Map<number, number>();
    sortedYears.forEach((year) => {
      yearsDataFiltered.set(year, 0);
    });

    filtered.projects.forEach((p: any) => {
      if (p.year) {
        const themes = base.projectThemes.filter((pt: any) => pt.projectId === p.id);
        const hasTheme = themes.some((pt: any) => pt.themeId === theme.id);
        if (hasTheme) {
          yearsDataFiltered.set(p.year, (yearsDataFiltered.get(p.year) || 0) + 1);
        }
      }
    });

    return {
      id: theme.id,
      label: theme.name,
      years: sortedYears.map((year) => ({
        year,
        count: hasFilteredData.value ? yearsDataFiltered.get(year) || 0 : yearsData.get(year) || 0,
      })),
    };
  }).filter((topic) => {
    // Only show topics that have at least one project
    return topic.years.some((y) => y.count > 0);
  });
});

// Big numbers
const totalProjects = computed(() => processedData.value.projects.length);
const totalEntities = computed(() => processedData.value.entities.length);
const totalProducts = computed(() => processedData.value.products.length);

// Filter handlers
function processClickOnChart(filterType: string, clickedObject: any) {
  activeFilter.value.filterType = filterType;
  activeFilter.value.content =
    filterType === FILTER_TYPES.country
      ? clickedObject.id || clickedObject.label
      : filterType === FILTER_TYPES.year
      ? String(clickedObject.label)
      : String(clickedObject.id);
  activeFilter.value.label = clickedObject.label || clickedObject.name;
}

function removeFilters() {
  activeFilter.value.filterType = FILTER_TYPES.none;
  activeFilter.value.content = "";
  activeFilter.value.label = "";
}

const statStripItems = computed(() => [
  {
    label: "Projects",
    value: totalProjects.value,
    accent: "#ff0777",
    items: processedData.value.projects,
  },
  {
    label: "Institutions",
    value: totalEntities.value,
    accent: "#1e63a2",
    items: processedData.value.entities,
  },
  
]);
</script>

<template>
  <div class="bg-neutral-lightest">
    <CaPageHeader
      n="01"
      kicker="DASHBOARD"
      title="Dashboard"
      intro="A bird's-eye view of the network: how many projects and entities there are, which countries host the most participants, and which adaptation topics are most common."
      help-title="Reading this page"
      help="Everything here is cross-filtered. A country selection scopes to institutions in that country and the projects they join; topic, risk or year filters narrow the project set across all charts."
    />

    <div class="mx-auto grid w-full max-w-[1536px] grid-cols-6 items-start gap-6 px-7 py-7 pb-24">
      <CaStatStrip :items="statStripItems" />

      <CaCard title="Active filters" class="col-span-3 self-start sticky top-[40px] z-10">
          <template #help>
            <CaHelp title="Filtering">
              Click a country to focus on its institutions and their projects. Click a topic, risk or year to narrow projects across the dashboard.
              Selections appear here; clear them to reset.
            </CaHelp>
          </template>
          <template #right>
            <button
              v-if="hasFilteredData"
              type="button"
              class="cursor-pointer font-mono text-2xs font-bold tracking-[0.1em] text-community-pink-dark"
              @click="removeFilters()"
            >
              CLEAR
            </button>
          </template>

          <div v-if="hasFilteredData" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <span
              class="inline-flex w-fit items-center gap-2 border border-neutral-darkest bg-warm-neutral-100 px-2.5 py-1.5"
            >
              <span class="h-2 w-2 bg-trust-blue-darkest" />
              <span class="font-mono text-2xs font-bold tracking-widest text-neutral-dark">FILTER</span>
              <span class="font-mono text-sm font-semibold">{{ activeFilter.label }}</span>
              <span class="cursor-pointer text-neutral-dark" @click="removeFilters()">✕</span>
            </span>
            <div class="border-t border-neutral-lighter pt-2 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
              <span class="block font-mono text-2xs text-neutral-dark">YEAR RANGE</span>
              <span class="font-mono text-xs text-neutral-darkest">{{ yearRange.min }} → {{ yearRange.max }}</span>
            </div>
          </div>
          <p v-else class="font-sans text-[13px] text-neutral-dark">
            Click on a country, topic, risk or year to enable a filter.
          </p>
      </CaCard>

      <div class="col-span-6 flex min-w-0 flex-col gap-6">
        <MapBarChart
          :data="dataForEntitiesByCountry"
          :has-filtered-data="hasFilteredData"
          :active-filter="activeFilter"
          :high-light-selected-region-id="
            activeFilter.filterType === FILTER_TYPES.country
              ? activeFilter.content
              : ''
          "
          :title="mapChartTitle"
          :subtitle="mapChartScopeHint"
          @_click="(event) => processClickOnChart(FILTER_TYPES.country, event.datum)"
        />

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <HorizontalBarChart
            :global-data="dataForProjectsByTheme"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            :subtitle="topicChartScopeHint"
            title="Projects by Topic"
            @set-filter="(event) => processClickOnChart(FILTER_TYPES.topic, event)"
          />
          <HorizontalBarChart
            :global-data="dataForProjectsByRisk"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            :subtitle="riskChartScopeHint"
            title="Projects by Risk"
            @set-filter="(event) => processClickOnChart(FILTER_TYPES.risk, event)"
          />
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div class="min-w-0 lg:col-span-3">
            <ProjectsEvolutionByTopic
              :data="dataForProjectsEvolutionByTopic"
              :has-filtered-data="hasFilteredData"
            />
          </div>

          <div class="flex min-w-0 flex-col gap-6 lg:col-span-2">
            <AreaChart
              :global-data="dataForProjectsByYear"
              :has-filtered-data="hasFilteredData"
              :active-filter="activeFilter"
              title="Projects per Year"
              @set-filter="(event) => processClickOnChart(FILTER_TYPES.year, event)"
            />
            <AreaChart
              :global-data="dataForInvestmentByYear"
              :has-filtered-data="hasFilteredData"
              :active-filter="activeFilter"
              :formatter="formatInvestment"
              title="Investment per Year"
              @set-filter="(event) => processClickOnChart(FILTER_TYPES.year, event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
