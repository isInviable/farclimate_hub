<template>
  <section class="relative">
    <div v-if="!isSearching && results.length > 0" class="px-4 py-2 mb-2">
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
    <div class="flex">
      <div class="flex-1">
        <ul v-if="isSearching">
          <li class="p-4 text-center">{{ $t("common.searching") }}</li>
        </ul>
        <template v-else-if="results && results.length > 0">
          <ul v-if="activeTab === 'default'" class="space-y-2">
            <li
              v-for="{ hit, badgeVisible, badgeOverflow } in rowsWithBadges"
              :key="hit.id"
              :class="[
                'cursor-pointer px-4 py-2 border-b-4 border-neutral-50',
                isPinned(hit)
                  ? 'bg-primary-50 hover:bg-primary-100'
                  : 'bg-white hover:bg-neutral-100',
              ]"
            >
              <div
                class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
              >
                <div class="flex min-w-0 flex-1 items-start gap-2">
                  <UCheckbox
                    :model-value="isSelected(hit.id)"
                    @update:model-value="() => toggleSelection(hit)"
                    color="primary"
                    size="md"
                    class="shrink-0 mt-0.5"
                  />
                  <Pin
                    class="mr-1 mb-2 min-w-0 flex-1"
                    :pin-id="hit.id"
                    :pin-title="hit.document?.title || ''"
                    pin-type="result"
                    :pin-data="hit.document"
                  >
                    <div
                      class="min-w-0 cursor-pointer text-sm font-mono"
                      @click="handleDocumentClick(hit.document)"
                    >
                      <span class="line-clamp-2 sm:line-clamp-1">{{
                        hit.document?.title
                      }}</span>
                    </div>
                  </Pin>
                </div>
                <div
                  v-if="badgeVisible.length > 0"
                  class="flex flex-wrap gap-1 sm:basis-[20%] sm:max-w-[min(20vw,12rem)] sm:shrink-0 sm:justify-end"
                  role="group"
                  :aria-label="$t('viewModes.matchingFiltersAria')"
                >
                  <UBadge
                    v-for="(b, i) in badgeVisible"
                    :key="`${hit.id}-${b.kind}-${i}`"
                    :color="b.color ?? 'neutral'"
                    variant="subtle"
                    size="xs"
                    class="max-w-full truncate"
                  >
                    {{ b.label }}
                  </UBadge>
                  <UBadge
                    v-if="badgeOverflow > 0"
                    color="neutral"
                    variant="outline"
                    size="xs"
                  >
                    {{
                      $t('viewModes.matchingFiltersMore', {
                        count: badgeOverflow,
                      })
                    }}
                  </UBadge>
                </div>
              </div>
            </li>
          </ul>
        </template>
      </div>
    </div>
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

const rowsWithBadges = computed(() =>
  pagedItems.value.map((hit) => {
    const all = listMatchBadgesForDocument(
      hit.document,
      searchStore.explorerEffectiveFilters
    )
    const { visible, overflow } = visibleListMatchBadges(all)
    return { hit, badgeVisible: visible, badgeOverflow: overflow }
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

<style scoped>
.side-panel-enter-active,
.side-panel-leave-active {
  transition: all 0.3s ease;
}

.side-panel-enter-from .main-content,
.side-panel-leave-to .main-content {
  margin-left: 0;
}
</style>
