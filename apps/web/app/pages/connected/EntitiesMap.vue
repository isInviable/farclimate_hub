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

    <div class="mx-auto w-full max-w-[1920px]  mb-24">
      <div class="relative h-[70vh] min-h-[640px] overflow-hidden">
        <div v-if="!ready" class="absolute inset-0 flex items-center justify-center">
          <USkeleton class="h-full w-full" />
        </div>

        <template v-else-if="indexes">
          <div class="absolute inset-0">
            <EntitiesMapCanvas
              :entities="mapEntities"
              :nuts-features="mapNutsFeatures"
              :hovered-nuts-id="hoveredNutsId"
              :selected-nuts-ids="selectedNutsIds"
              :selected-entity-ids="selectedEntities"
              :selection-mode="selectionMode"
              :active-region-ids="[...activeRegions]"
              :active-entity-ids="[...activeEntities]"
              @hover-nuts="hoveredNutsId = $event"
              @toggle-nuts="toggleNuts"
              @toggle-entity="toggleEntity"
            />
          </div>

          <div
            v-if="ready"
            class="absolute bottom-3 left-[4.25rem] z-10 flex gap-1 rounded-md bg-neutral-lightest/90 p-1 shadow backdrop-blur-sm"
          >
            <UButton
              size="sm"
              :variant="selectionMode === 'nuts' ? 'solid' : 'ghost'"
              :color="selectionMode === 'nuts' ? 'primary' : 'neutral'"
              @click="selectionMode = 'nuts'"
            >
              NUTS3
            </UButton>
            <UButton
              size="sm"
              :variant="selectionMode === 'entities' ? 'solid' : 'ghost'"
              :color="selectionMode === 'entities' ? 'primary' : 'neutral'"
              @click="selectionMode = 'entities'"
            >
              Entities
            </UButton>
          </div>

          <EntitiesMapFilters
            :risk-options="riskOptions"
            :theme-options="themeOptions"
            :projects-with-simple-entities="projectsWithSimpleEntities"
            :entities-with-projects="mapEntities"
            :active-projects="activeProjects"
            :selectable-projects="selectableProjects"
            :active-entities="activeEntities"
            :selectable-risks="selectableRisks"
            :selectable-themes="selectableThemes"
            :panel-active-risks="panelActiveRisks"
            :panel-active-themes="panelActiveThemes"
            :selected-projects="selectedProjects"
            :selected-risks="selectedRisks"
            :selected-themes="selectedThemes"
            :selected-entities="selectedEntities"
            :toggle-risk="toggleRisk"
            :toggle-theme="toggleTheme"
            :toggle-project="toggleProject"
            :toggle-entity="toggleEntity"
          />

          <EntitiesMapNutsPanel
            v-model:min-entities-per-nuts="minEntitiesPerNuts"
            :regions="indexes.regions"
            :active-regions="activeRegions"
            :selected-nuts-ids="selectedNutsIds"
            :hovered-nuts-id="hoveredNutsId"
            :hovered-entities-count="hoveredEntities.length"
            :entity-count-by-region="entityCountByRegion"
            :max-entities-per-nuts="maxEntityCountPerNuts"
            :get-nuts-name-by-id="geo.getNutsNameById"
            :toggle-nuts="toggleNuts"
          />
        </template>

        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          class="absolute inset-4"
          title="Failed to load map data"
          :description="String(error)"
        />

        <UButton
          v-if="ready"
          icon="i-heroicons-information-circle"
          color="primary"
          size="lg"
          square
          class="absolute bottom-4 right-4 z-50 shadow-lg"
          @click="showInfoModal = true"
        >
          <span class="sr-only">Entities information</span>
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showInfoModal" title="Entities Information" class="w-[90vw] max-w-5xl">
      <template #body>
        <UTabs v-model="selectedInfoTab" :items="infoModalTabs">
          <template #without-geolocation>
            <div class="mt-4 max-h-[60vh] overflow-y-auto">
              <UTable
                :data="entitiesWithoutGeolocation"
                :columns="infoColumns"
                empty="No entities without geolocation"
              />
            </div>
          </template>
          <template #without-projects>
            <div class="mt-4 max-h-[60vh] overflow-y-auto">
              <UTable
                :data="entitiesWithoutProjects"
                :columns="infoColumns"
                empty="No entities without projects"
              />
            </div>
          </template>
          <template #without-nuts>
            <div class="mt-4 max-h-[60vh] overflow-y-auto">
              <UTable
                :data="entitiesWithoutNuts"
                :columns="infoNutsColumns"
                empty="No entities without NUTS"
              />
            </div>
          </template>
        </UTabs>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: "connected" });

const { indexes, ready, error, geo } = useConnectedCordisIndexes();

const filters = useEntitiesMapFilters(indexes);

const {
  selectedProjects,
  selectedRisks,
  selectedThemes,
  selectedEntities,
  selectedNutsIds,
  hoveredNutsId,
  selectionMode,
  minEntitiesPerNuts,
  maxEntityCountPerNuts,
  entityCountByRegion,
  mapEntities,
  regionsMatchingEntityCount,
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
  hoveredEntities,
  entitiesWithoutGeolocation,
  entitiesWithoutProjects,
  entitiesWithoutNuts,
  toggleRisk,
  toggleTheme,
  toggleProject,
  toggleEntity,
  toggleNuts,
} = filters;

type NutsMapFeature = {
  properties: { NUTS_ID: string; NUTS_NAME: string };
  geometry: GeoJSON.Geometry;
};

const nutsFeatures = computed(
  () => (geo.nutsGeo.value?.features ?? []) as NutsMapFeature[]
);

const mapNutsFeatures = computed(() => {
  const allowed = regionsMatchingEntityCount.value;
  if (!allowed) return nutsFeatures.value;
  return nutsFeatures.value.filter((feature) => allowed.has(feature.properties.NUTS_ID));
});

const showInfoModal = ref(false);
const selectedInfoTab = ref("without-geolocation");

const infoColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "legal_name", header: "Legal Name" },
  { accessorKey: "short_name", header: "Short Name" },
  { accessorKey: "address_country", header: "Country" },
  { accessorKey: "projectsCount", header: "Projects" },
  { accessorKey: "projectsTotalCost", header: "Total Cost" },
];

const infoNutsColumns = [
  ...infoColumns,
  { accessorKey: "related_nuts_code_nuts_code", header: "NUTS Code" },
  { accessorKey: "related_region_nuts_code", header: "Region NUTS Code" },
];

const infoModalTabs = computed(() => [
  {
    label: `Without Geolocation (${entitiesWithoutGeolocation.value.length})`,
    value: "without-geolocation",
    slot: "without-geolocation",
  },
  {
    label: `Without NUTS (${entitiesWithoutNuts.value.length})`,
    value: "without-nuts",
    slot: "without-nuts",
  },
  {
    label: `Without Projects (${entitiesWithoutProjects.value.length})`,
    value: "without-projects",
    slot: "without-projects",
  },
]);
</script>
