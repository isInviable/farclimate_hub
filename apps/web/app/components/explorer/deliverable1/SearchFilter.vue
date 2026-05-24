<template>
  <FilterComponent
    title="Search"
    icon="i-heroicons-magnifying-glass"
    filter-key="search"
    :has-visualization="false"
    :enabled="isSearchEnabled"
    :initial-value="searchStore.searchQuery"
    @filter-change="handleFilterChange"
    @filter-clear="handleFilterClear"
    @filter-apply="handleFilterApply"
  >
    <template #controls="{ updateValue }">
      <!-- Search Input + joined Search button -->
      <div class="mb-3 flex items-stretch -space-x-px">
        <UInput
          icon="i-lucide-search"
          size="md"
          variant="editorial"
          class="grow"
          placeholder="Search corpus…"
          :model-value="searchStore.searchQuery"
          @update:model-value="(v) => onSearchInput(v, updateValue)"
          @keyup.enter="handleSearch"
        />
        <UButton
          @click="handleSearch"
          :disabled="isSearching"
          size="md"
          variant="editorial-solid"
        >
          {{ isSearching ? "…" : "Search" }}
        </UButton>
      </div>

      <!-- Recommendation pills (editorial chip language) -->
      <div>
        <div class="font-mono uppercase text-2xs font-bold tracking-widest text-neutral-dark mb-2">
          {{ $t('explorer.exampleQueries', 'Example queries') }}
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="pill in recommendationPills"
            :key="pill"
            type="button"
            class="inline-flex items-center px-2 py-1 border border-neutral-darkest bg-transparent text-neutral-darkest hover:bg-neutral-darkest hover:text-neutral-lightest transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono text-2xs uppercase tracking-widest"
            @click="searchWithPill(pill)"
          >
            {{ $t(`pills.${pill}`) }}
          </button>
        </div>
      </div>
    </template>
  </FilterComponent>
</template>

<script setup lang="ts">
import { useSearchStore } from "@/stores/search";
import FilterComponent from "./FilterComponent.vue";

const props = defineProps<{
  enabled?: boolean;
}>();

const emit = defineEmits<{
  'search-results': [results: any];
  'search-error': [error: any];
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
  'run-search': [];
}>();

const { t } = useI18n();
const searchStore = useSearchStore();

const isSearchEnabled = computed(() => props.enabled || false);
const isSearching = computed(() => searchStore.isSearching);

const recommendationPills = ref([
  "forestry",
  "agriculture",
  "fishery",
  "mediterranean",
  "atlantic",
  "continental",
  "alpine",
  "boreal",
  "climateAdaptation",
  "waterManagement",
  "biodiversity",
]);

function onSearchInput(v: string | number, updateValue: (val: unknown) => void) {
  const s = String(v ?? "");
  searchStore.setSearchQuery(s);
  updateValue(s);
}

const handleFilterChange = (key: string, value: any, enabled: boolean) => {
  if (enabled && value !== undefined && value !== null && typeof value === "string") {
    searchStore.setSearchQuery(value);
  }
  emit('filter-change', key, value, enabled);
};

const handleFilterClear = (key: string) => {
  searchStore.setSearchQuery('');
  emit('filter-clear', key);
};

const handleFilterApply = (key: string, value: any) => {
  if (typeof value === "string") searchStore.setSearchQuery(value);
  emit('filter-apply', key, value);
};

const handleSearch = async () => {
  if (!searchStore.searchQuery.trim()) return;

  if (!isSearchEnabled.value) {
    emit('filter-change', 'search', searchStore.searchQuery, true);
  }

  emit('run-search');
};

const searchWithPill = (pill: string) => {
  const currentQuery = searchStore.searchQuery.trim();
  const translatedTerm = t(`pills.${pill}`);

  if (currentQuery.toLowerCase().includes(translatedTerm.toLowerCase())) {
    return;
  }

  const next = currentQuery ? `${currentQuery} ${translatedTerm}` : translatedTerm;
  searchStore.setSearchQuery(next);
  handleSearch();
};
</script>
