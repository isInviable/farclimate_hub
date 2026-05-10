<template>
  <section class="relative bg-neutral-lightest">
    <div
      v-if="!isSearching && results.length > 0"
      class=""
    >
      <ExplorerResultsToolbar
        v-model:page="page"
        v-model:sort-key="sortKey"
        :total-count="totalCount"
        :range-start="rangeStart"
        :range-end="rangeEnd"
        :page-size="pageSize"
        show-pagination
        show-sort
        show-bulk-select
        :all-on-page-selected="sel.isAllSelected(pageSelectionItems)"
        @bulk-toggle="toggleSelectAllOnPage"
      />
    </div>

    <ul v-if="isSearching">
      <li class="p-4 text-center font-mono text-xs text-neutral-dark">
        {{ $t("common.searching") }}
      </li>
    </ul>

    <ul
      v-else-if="results.length > 0 && activeTab === 'default'"
      class="divide-y divide-neutral-darkest/15"
    >
      <li
        v-for="({ hit, badgeVisible, badgeOverflow, meta }, index) in rowsWithBadges"
        :key="hit.id"
        :class="[
          'group relative cursor-pointer transition-colors',
          isPinned(hit)
            ? 'bg-primary-50 hover:bg-primary-100'
            : isSelected(hit.id)
              ? 'bg-neutral-300'
              : 'bg-neutral-100 hover:bg-neutral-200',
        ]"
        @click="handleDocumentClick(hit.document)"
      >
        <span
          v-if="isSelected(hit.id)"
          class="absolute left-0 top-0 bottom-0 w-[2px] bg-neutral-darkest"
          aria-hidden="true"
        />
        <div
          class="grid gap-4 px-4 py-3 sm:grid-cols-[32px_72px_minmax(0,1fr)_180px_96px] sm:items-start"
        >
          <div
            class="flex flex-row sm:flex-col items-center sm:items-start gap-2 pt-0.5"
            @click.stop
          >
            <UCheckbox
              :model-value="isSelected(hit.id)"
              color="primary"
              size="xs"
              @update:model-value="() => toggleSelection(hit)"
            />
            <span
              class="font-mono text-2xs text-neutral-dark tabular-nums tracking-[0.08em]"
            >
              {{ String((page - 1) * pageSize + index + 1).padStart(3, "0") }}
            </span>
          </div>

          <div v-if="meta.year" class="leading-none">
            <span class="font-display font-bold text-[28px] leading-none text-neutral-darkest">
              {{ meta.year }}
            </span>
            <EditorialEyebrow color="muted" class="block mt-1.5">
              {{ $t("common.year", "Year") }}
            </EditorialEyebrow>
          </div>
          <div v-else class="hidden sm:block" />

          <div class="min-w-0">
            <div
              v-if="meta.sector || meta.solutionType"
              class="flex items-center gap-2 mb-2 min-w-0"
            >
              <EditorialEyebrow
                v-if="meta.sector"
                color="primary"
                class="truncate"
              >
                {{ meta.sector }}
              </EditorialEyebrow>
              <span
                v-if="meta.sector && meta.solutionType"
                class="w-px h-3 bg-neutral-darkest/30 shrink-0"
                aria-hidden="true"
              />
              <EditorialEyebrow
                v-if="meta.solutionType"
                color="muted"
                class="truncate"
              >
                {{ meta.solutionType }}
              </EditorialEyebrow>
            </div>

            <ViewModeGridHitContext :document="hit.document">
              <CapturableBlock
                pin-kind="text_segment"
                :title="hit.document?.title ?? ''"
                :preview="hit.document?.title ?? ''"
                :payload="{ markdown: hit.document?.title ?? '' }"
                :chrome="false"
                source-view="explorer-list"
                class="block w-full min-w-0"
              >
                <h3
                  class="font-display font-bold text-[20px] leading-[1.2] text-neutral-darkest line-clamp-2"
                >
                  {{ hit.document?.title }}
                </h3>
              </CapturableBlock>
            </ViewModeGridHitContext>

            <div
              v-if="badgeVisible.length > 0"
              class="flex flex-wrap gap-1.5 mt-2"
              role="group"
              :aria-label="$t('viewModes.matchingFiltersAria')"
            >
              <UBadge
                v-for="(b, i) in badgeVisible"
                :key="`${hit.id}-${b.kind}-${i}`"
                variant="editorial"
                size="xs"
                class="max-w-full truncate"
              >
                {{ b.label }}
              </UBadge>
              <UBadge
                v-if="badgeOverflow > 0"
                variant="editorial"
                size="xs"
                class="opacity-70"
              >
                {{
                  $t("viewModes.matchingFiltersMore", { count: badgeOverflow })
                }}
              </UBadge>
            </div>
          </div>

          <div
            v-if="meta.region || meta.bioregion"
            class="hidden sm:block min-w-0"
          >
            <template v-if="meta.region">
              <EditorialEyebrow color="muted" class="block">
                {{ $t("common.region", "Region") }}
              </EditorialEyebrow>
              <p class="text-sm text-neutral-darkest mt-1 truncate">
                {{ meta.region }}
              </p>
            </template>
            <template v-if="meta.bioregion">
              <EditorialEyebrow
                color="muted"
                class="block"
                :class="{ 'mt-3': meta.region }"
              >
                {{ $t("common.bioregion", "Bioregion") }}
              </EditorialEyebrow>
              <p class="font-mono text-xs font-semibold text-neutral-darkest mt-1 truncate">
                {{ meta.bioregion }}
              </p>
            </template>
          </div>
          <div v-else class="hidden sm:block" />

          <div class="hidden sm:flex flex-col items-end gap-2 pt-0.5">
            <EditorialEyebrow size="2xs" color="default" class="opacity-70 group-hover:opacity-100">
              {{ $t("viewModes.read", "Read") }} →
            </EditorialEyebrow>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useSearchSelectionStore } from '@/stores/searchSelection'
import type { SearchSelectedItem } from '@/stores/searchSelection'
import {
  useExplorerResultsPaging,
  type ExplorerSortKey,
} from '@/composables/useExplorerResultsPaging'
import type { ArticleDetail } from '~/types/search'
import { useSearchStore } from '@/stores/search'
import {
  listMatchBadgesForDocument,
  visibleListMatchBadges,
} from '@/utils/listMatchBadges'

interface ListHit {
  id: string
  document: ArticleDetail
}

const props = withDefaults(
  defineProps<{
    results?: ListHit[]
    isSearching?: boolean
  }>(),
  { results: () => [] }
)

const emit = defineEmits<{
  'document-selected': [document: ArticleDetail]
}>()

const activeTab = ref('default')
const sortKey = ref<ExplorerSortKey>('name')

const { page, pageSize, totalCount, pagedItems, rangeStart, rangeEnd } =
  useExplorerResultsPaging(toRef(props, 'results'), {
    pageSize: 20,
    sortKey,
  })

const sel = useSearchSelectionStore()
const searchStore = useSearchStore()
const isSelected = (id: string) => sel.isSelected(id)

/** Editorial row metadata extracted from heterogeneous document shapes. */
function buildMeta(doc: ArticleDetail | undefined) {
  if (!doc) return { year: '', sector: '', solutionType: '', region: '', bioregion: '' }
  const years = doc.implementation_years
  const yearNum = years?.start_year || years?.end_year || null
  const sectorRaw = Array.isArray(doc.sectors) ? doc.sectors[0] : doc.sectors
  const approach = doc.adaptation_approaches?.[0]
  const geo = doc.geographic_characterisation
  const region = [geo?.city, geo?.countries].filter(Boolean).join(', ')
  return {
    year: yearNum ? String(yearNum) : '',
    sector: sectorRaw ? String(sectorRaw) : '',
    solutionType: approach ? String(approach) : '',
    region,
    bioregion: geo?.biogeographical_regions ?? '',
  }
}

const rowsWithBadges = computed(() =>
  pagedItems.value.map((hit) => {
    const all = listMatchBadgesForDocument(
      hit.document,
      searchStore.explorerEffectiveFilters
    )
    const { visible, overflow } = visibleListMatchBadges(all)
    return {
      hit,
      badgeVisible: visible,
      badgeOverflow: overflow,
      meta: buildMeta(hit.document),
    }
  })
)

const pageSelectionItems = computed<SearchSelectedItem[]>(() =>
  pagedItems.value.map((h) => ({
    id: h.id,
    title: h.document?.title ?? '',
    document: h.document,
  }))
)

function toggleSelectAllOnPage() {
  const items = pageSelectionItems.value
  if (items.length === 0) return
  if (sel.isAllSelected(items)) sel.removeByIds(items.map((i) => i.id))
  else sel.mergeAdd(items)
}

const toggleSelection = (hit: ListHit) =>
  sel.toggle({
    id: hit.id,
    title: hit.document?.title || '',
    document: hit.document,
  })

const pinsApi = usePinsSupabase()
const isPinned = (hit: ListHit) =>
  pinsApi.isDocumentPinned(hit.document?.document_uid)

function handleDocumentClick(document: ArticleDetail) {
  emit('document-selected', document)
}
</script>
