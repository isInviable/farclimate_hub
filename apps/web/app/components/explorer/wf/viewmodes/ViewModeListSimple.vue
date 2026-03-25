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
              v-for="hit in pagedItems"
              :key="hit.id"
              :class="[
                'cursor-pointer px-4 py-2 border-b-4 border-neutral-50',
                isPinned(hit)
                  ? 'bg-primary-50 hover:bg-primary-100'
                  : 'bg-white hover:bg-neutral-100',
              ]"
            >
              <div class="flex justify-start items-center gap-2">
                <UCheckbox
                  :model-value="isSelected(hit.id)"
                  @update:model-value="() => toggleSelection(hit)"
                  color="primary"
                  size="md"
                />
                <Pin
                  class="mr-1 mb-2"
                  :pin-id="hit.id"
                  :pin-title="hit.document?.title || ''"
                  pin-type="result"
                  :pin-data="hit.document"
                >
                  <div
                    class="flex justify-between grow cursor-pointer text-sm font-mono"
                    @click="handleDocumentClick(hit.document)"
                  >
                    <span>{{ hit.document?.title }}</span>
                  </div>
                </Pin>
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
const isSelected = (id: string) => sel.isSelected(id)

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

const pinsStore = usePinsStore()
const isPinned = (hit: ListHit) =>
  pinsStore.pinnedItems?.some((i: { id: string }) => i.id === hit.id)

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
