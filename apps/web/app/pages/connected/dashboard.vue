<script setup lang="ts">
definePageMeta({ layout: 'connected' });

import {
  fetchProjectsTable,
  fetchEntitiesTable,
  fetchProductsTable,
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

// Fetch all data
const { data: rawProjects } = await useAsyncData("dashboard-projects", fetchProjectsTable);
const { data: rawEntities } = await useAsyncData("dashboard-entities", fetchEntitiesTable);
const { data: rawProducts } = await useAsyncData("dashboard-products", fetchProductsTable);
const { data: rawProjectRisks } = await useAsyncData("dashboard-project-risks", fetchProjectRisksTable);
const { data: rawProjectThemes } = await useAsyncData("dashboard-project-themes", fetchProjectThemesTable);
const { data: rawRisks } = await useAsyncData("dashboard-risks", fetchAuxClimateRisks);
const { data: rawThemes } = await useAsyncData("dashboard-themes", fetchAuxThemes);

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
    country: e.address_country || "Unknown",
    legal_name: e.legal_name,
    short_name: e.short_name,
    address_country: e.address_country,
  }));

  return {
    projects,
    entities,
    products: rawProducts.value || [],
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

// Processed data with filters applied
const processedData = computed(() => {
  let projects = [...processedDataBase.value.projects];
  let entities = [...processedDataBase.value.entities];

  // Apply year filter
  projects = projects.filter(
    (p) => p.year && p.year >= yearRange.value.min && p.year <= yearRange.value.max
  );

  // Apply active filter
  if (activeFilter.value.filterType === FILTER_TYPES.country) {
    entities = entities.filter((e) => e.country === activeFilter.value.content);
    // Filter projects by entities in that country
    // This would require project-entities relationship
  } else if (activeFilter.value.filterType === FILTER_TYPES.risk) {
    const riskId = parseInt(activeFilter.value.content);
    const projectIdsWithRisk = new Set(
      processedDataBase.value.projectRisks
        .filter((pr: any) => pr.riskId === riskId)
        .map((pr: any) => pr.projectId)
    );
    projects = projects.filter((p) => projectIdsWithRisk.has(p.id));
  } else if (activeFilter.value.filterType === FILTER_TYPES.topic) {
    const themeId = parseInt(activeFilter.value.content);
    const projectIdsWithTheme = new Set(
      processedDataBase.value.projectThemes
        .filter((pt: any) => pt.themeId === themeId)
        .map((pt: any) => pt.projectId)
    );
    projects = projects.filter((p) => projectIdsWithTheme.has(p.id));
  } else if (activeFilter.value.filterType === FILTER_TYPES.year) {
    const year = parseInt(activeFilter.value.content);
    projects = projects.filter((p) => p.year === year);
  }

  return {
    projects,
    entities,
    products: processedDataBase.value.products,
  };
});

// Dashboard data structures
const dataForDashboard = computed(() => {
  const base = processedDataBase.value;
  const filtered = processedData.value;

  // Entities per country
  const entitiesByCountry = new Map<string, number>();
  base.entities.forEach((e: any) => {
    const country = e.country || "Unknown";
    entitiesByCountry.set(country, (entitiesByCountry.get(country) || 0) + 1);
  });

  const entitiesByCountryFiltered = new Map<string, number>();
  filtered.entities.forEach((e: any) => {
    const country = e.country || "Unknown";
    entitiesByCountryFiltered.set(
      country,
      (entitiesByCountryFiltered.get(country) || 0) + 1
    );
  });

  // Projects per topic
  const projectsByTheme = new Map<number, number>();
  base.projectThemes.forEach((pt: any) => {
    projectsByTheme.set(
      pt.themeId,
      (projectsByTheme.get(pt.themeId) || 0) + 1
    );
  });

  const projectsByThemeFiltered = new Map<number, number>();
  filtered.projects.forEach((p: any) => {
    const themes = base.projectThemes.filter((pt: any) => pt.projectId === p.id);
    themes.forEach((pt: any) => {
      projectsByThemeFiltered.set(
        pt.themeId,
        (projectsByThemeFiltered.get(pt.themeId) || 0) + 1
      );
    });
  });

  // Projects per risk
  const projectsByRisk = new Map<number, number>();
  base.projectRisks.forEach((pr: any) => {
    projectsByRisk.set(pr.riskId, (projectsByRisk.get(pr.riskId) || 0) + 1);
  });

  const projectsByRiskFiltered = new Map<number, number>();
  filtered.projects.forEach((p: any) => {
    const risks = base.projectRisks.filter((pr: any) => pr.projectId === p.id);
    risks.forEach((pr: any) => {
      projectsByRiskFiltered.set(
        pr.riskId,
        (projectsByRiskFiltered.get(pr.riskId) || 0) + 1
      );
    });
  });

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

  return {
    entitiesByCountry: Array.from(entitiesByCountry.entries()).map(([country, count]) => ({
      id: country,
      label: country,
      count,
      count_f: entitiesByCountryFiltered.get(country) || 0,
    })),
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
  return dataForDashboard.value.projectsByTheme
    .sort((a, b) => b.count - a.count)
    .map((d) => ({
      ...d,
      count_f: d.count_f || 0,
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
</script>

<template>
  <div class="bg-neutral-lightest">
    <CaPageHeader
      n="01"
      kicker="DASHBOARD"
      title="Dashboard"
      intro="A bird's-eye view of the network: how many projects and entities there are, which countries host the most participants, and which adaptation topics are most common."
      help-title="Reading this page"
      help="Everything here is cross-filtered. Selecting a country, topic or year narrows the figures across the whole dashboard — useful for asking 'who and what is concentrated where?'"
    />

    <div class="mx-auto max-w-[1320px] px-7 py-7 pb-24">
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
        <!-- main column -->
        <div class="flex min-w-0 flex-col gap-6">
          <MapBarChart
            :data="dataForEntitiesByCountry"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            :high-light-selected-region-id="
              activeFilter.filterType === FILTER_TYPES.country
                ? activeFilter.content
                : ''
            "
            title="Entities per Country"
            @_click="(event) => processClickOnChart(FILTER_TYPES.country, event.datum)"
          />

          <HorizontalBarChart
            :global-data="dataForProjectsByTheme"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            title="Projects by Topic"
            @set-filter="(event) => processClickOnChart(FILTER_TYPES.topic, event)"
          />

          <HorizontalBarChart
            :global-data="dataForProjectsByRisk"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            title="Projects by Risk"
            @set-filter="(event) => processClickOnChart(FILTER_TYPES.risk, event)"
          />

          <ProjectsEvolutionByTopic
            :data="dataForProjectsEvolutionByTopic"
            :has-filtered-data="hasFilteredData"
          />

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
              :formatter="(d: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(d)"
              title="Investment per Year"
              @set-filter="(event) => processClickOnChart(FILTER_TYPES.year, event)"
            />
          </div>
        </div>

        <!-- sidebar -->
        <div class="flex flex-col gap-6 lg:sticky lg:top-[70px]">
          <CaCard title="Active filters">
            <template #help>
              <CaHelp title="Filtering">
                Click any country (on the map or bars), topic or year to scope the dashboard.
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

            <div v-if="hasFilteredData" class="flex flex-col gap-3">
              <span
                class="inline-flex w-fit items-center gap-2 border border-neutral-darkest bg-warm-neutral-100 px-2.5 py-1.5"
              >
                <span class="h-2 w-2 bg-trust-blue-darkest" />
                <span class="font-mono text-[9px] font-bold tracking-[0.1em] text-neutral-dark">FILTER</span>
                <span class="font-mono text-[11px] font-semibold">{{ activeFilter.label }}</span>
                <span class="cursor-pointer text-neutral-dark" @click="removeFilters()">✕</span>
              </span>
              <div class="border-t border-neutral-lighter pt-2">
                <span class="block font-mono text-2xs text-neutral-dark">YEAR RANGE</span>
                <span class="font-mono text-xs text-neutral-darkest">{{ yearRange.min }} → {{ yearRange.max }}</span>
              </div>
            </div>
            <p v-else class="font-sans text-[13px] text-neutral-dark">
              Click on a country, topic or year to enable a filter.
            </p>
          </CaCard>

          <BAN
            title="Projects"
            :value="totalProjects"
            :items="processedData.projects"
            accent="#ff0777"
          />
          <BAN
            title="Institutions"
            :value="totalEntities"
            :items="processedData.entities"
            accent="#1e63a2"
          />
          <BAN
            title="Products"
            :value="totalProducts"
            :items="processedData.products"
            accent="#9e9e14"
          />
        </div>
      </div>
    </div>
  </div>
</template>
