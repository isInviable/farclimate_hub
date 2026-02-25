<script setup lang="ts">
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

  const projectEntities = computed(() => {
    // We'll need to fetch this separately or compute from relationships
    return [];
  });

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
        count: hasFilteredData ? yearsDataFiltered.get(year) || 0 : yearsData.get(year) || 0,
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

function updateYearRange(range: [number, number]) {
  yearRange.value.min = range[0];
  yearRange.value.max = range[1];
  removeFilters();
}

const hasFilteredData = computed(() => activeFilter.value.filterType !== FILTER_TYPES.none);
</script>

<template>
  <div class="bg-gray-50 pb-8 pt-2">
    <!-- Dashboard container -->
    <div class="mx-auto w-full max-w-[1440px] my-8 mb-32">
      <!-- Dashboard grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
        <div class="bg-blue-darkest col-span-2 text-white text-center py-4 uppercase">
          <div class="text-4xl font-bold px-8 py-4">The climate adaptation network in Europe
            </div>
        </div>
        <div >
          <UButton variant="ghost" color="secondary" size="lg" class="text-4xl uppercase"> Dashboard</UButton>
          <UButton variant="link" color="neutral" size="lg" class="text-4xl uppercase"> Network</UButton>
        </div>
        <!-- Row 1: Map (2 cols) | Right Column (1 col) -->
        <!-- Map + Bar Chart (2 columns) -->
        <div class="col-span-1 md:col-span-2 lg:col-span-2">
          <DashboardMapBarChart
            :data="dataForEntitiesByCountry"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            :high-light-selected-region-id="
              activeFilter.filterType === FILTER_TYPES.country
                ? activeFilter.content
                : ''
            "
            @_click="(event) => processClickOnChart(FILTER_TYPES.country, event.datum)"
            title="Entities per Country"
          />
        </div>

        <!-- Right Column: Active Filters + Projects BAN -->
        <div class="flex flex-col gap-4">
          <!-- Active Filters Widget -->
          <div class="bg-white border-gray-50 border-2 p-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-gray-700">ACTIVE FILTERS</h3>
              <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4 text-gray-400" />
            </div>
            
            <!-- Show filter info when active -->
            <div v-if="hasFilteredData" class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <p class="text-xs text-gray-500 mb-1">Filter:</p>
                  <p class="text-sm font-semibold text-gray-900">{{ activeFilter.label }}</p>
                </div>
                <button
                  @click="removeFilters()"
                  class="cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
                  title="Remove filter"
                >
                  <svg
                    viewBox="0 0 48 48"
                    class="w-5 h-5 stroke-gray-600 hover:stroke-gray-900"
                    fill="none"
                    stroke-width="1.5"
                  >
                    <path
                      d="M 24.249 3.011 C 8.002 3.011 -2.159 20.599 5.968 34.674 C 14.094 48.742 34.404 48.742 42.53 34.674 C 44.384 31.466 45.357 27.827 45.357 24.12 C 45.357 12.461 35.908 3.011 24.249 3.011 Z M 32.076 28.957 C 33.243 30.086 32.75 32.059 31.189 32.508 C 30.44 32.72 29.629 32.508 29.086 31.946 L 24.249 27.103 L 19.405 31.946 C 18.238 33.07 16.285 32.514 15.891 30.935 C 15.717 30.23 15.916 29.481 16.422 28.957 L 21.265 24.12 L 16.422 19.276 C 15.292 18.109 15.854 16.156 17.433 15.762 C 18.138 15.588 18.887 15.787 19.405 16.293 L 24.249 21.136 L 29.086 16.293 C 30.259 15.163 32.207 15.725 32.6 17.304 C 32.781 18.009 32.581 18.758 32.076 19.276 L 27.232 24.12 L 32.076 28.957 Z"
                    />
                  </svg>
                </button>
              </div>
              <div class="pt-2 border-t border-gray-200">
                <p class="text-xs text-gray-500 mb-1">Year Range:</p>
                <p class="text-xs text-gray-700">
                  <span>{{ yearRange.min }}</span> →
                  <span>{{ yearRange.max }}</span>
                </p>
              </div>
            </div>
            
            <!-- Show instruction when no filter -->
            <p v-else class="text-xs text-gray-600">
              Click on a country, topic or year to enable a filter.
            </p>
          </div>

          <!-- Projects BAN -->
          <DashboardBAN title="Projects" :value="totalProjects" :items="processedData.projects" />
        </div>

        <!-- Row 2: Projects by Topic (2 cols) | Institutions + Products BANs (1 col) -->
        <!-- Projects by Topic (2 columns) -->
        <div class="col-span-1 md:col-span-2 lg:col-span-2 bg-white border-gray-50 border-2">
          <DashboardHorizontalBarChart
            :global-data="dataForProjectsByTheme"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            :colors="{ default: '#00B4E1', active: '#F9B401', gray: '#E6E6E6' }"
            :colors-scale="[
              '#dbebff',
              '#c2dffc',
              '#a8d3f8',
              '#8ec6f5',
              '#74baf1',
              '#59aded',
              '#3d9fe9',
              '#1f91e5',
              '#0082e1',
            ]"
            @set-filter="(event) => processClickOnChart(FILTER_TYPES.topic, event)"
            title="Projects by Topic"
          />
        </div>

        <!-- Institutions + Products BANs in right column (Row 2) -->
        <div class="flex flex-col gap-4">
          <DashboardBAN title="Institutions" :value="totalEntities" :items="processedData.entities" />
          <DashboardBAN title="Products" :value="totalProducts" :items="processedData.products" />
        </div>

        <!-- Row 3: Projects by Risk (2 cols) | Empty (1 col) -->
        <!-- Projects by Risk (2 columns) -->
        <div class="col-span-1 md:col-span-2 lg:col-span-2 bg-white border-gray-50 border-2">
          <DashboardHorizontalBarChart
            :global-data="dataForProjectsByRisk"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            :colors="{ default: '#FF5C5F', active: '#F9B401', gray: '#E6E6E6' }"
            :colors-scale="[
              '#dbebff',
              '#c2dffc',
              '#a8d3f8',
              '#8ec6f5',
              '#74baf1',
              '#59aded',
              '#3d9fe9',
              '#1f91e5',
              '#0082e1',
            ]"
            @set-filter="(event) => processClickOnChart(FILTER_TYPES.risk, event)"
            title="Projects by Risk"
          />
        </div>

        <!-- Empty space in right column for alignment -->
        <div></div>





        <!-- Row 5: Projects Evolution by Topic (2 cols) | Empty (1 col) -->
        <div class="col-span-1 md:col-span-2 lg:col-span-2">
          <DashboardProjectsEvolutionByTopic
            :data="dataForProjectsEvolutionByTopic"
            :has-filtered-data="hasFilteredData"
          />
        </div>
        <div class="flex flex-col gap-4">
                  <!-- Projects per Year (1 column) -->
        <div class="bg-white border-gray-50 border-2">
          <DashboardAreaChart
            :global-data="dataForProjectsByYear"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            :colors="{ default: '#cece89', active: '#F9B401', gray: '#E6E6E6' }"
            @set-filter="(event) => processClickOnChart(FILTER_TYPES.year, event)"
            title="Projects per Year"
          />
        </div>

        <!-- Investment per Year (1 column) -->
        <div class="bg-white border-gray-50 border-2">
          <DashboardAreaChart
            :global-data="dataForInvestmentByYear"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            :formatter="(d: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(d)"
            :colors="{ default: '#cece89', active: '#F9B401', gray: '#E6E6E6' }"
            @set-filter="(event) => processClickOnChart(FILTER_TYPES.year, event)"
            title="Investment per Year"
          />
        </div>
        
        </div>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(100px);
}
</style>
