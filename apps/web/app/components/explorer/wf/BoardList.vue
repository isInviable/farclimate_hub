<template>
  <div class="flex">
    <!-- Left Sidebar - Filters -->
    <aside class="w-64 mr-4 border-r border-gray-200 min-h-screen p-6">
      <h3 class="font-semibold text-gray-800 mb-4">Pins by Category</h3>
      
      <div class="space-y-2">
        <button
          v-for="category in categories"
          :key="category.value"
          @click="selectedCategory = category.value"
          :class="[
            'w-full text-left px-4 py-2 rounded-lg transition-colors',
            selectedCategory === category.value
              ? 'bg-neutral-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          <div class="flex items-center justify-between">
            <span>{{ category.label }}</span>
            <span class="text-sm opacity-75">
              {{ getCategoryCount(category.value) }}
            </span>
          </div>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 p-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Pinned Items</h1>
        <p class="text-gray-600">
          {{ filteredItems.length }} item{{ filteredItems.length !== 1 ? 's' : '' }} 
          {{ selectedCategory !== 'all' ? `in ${getCategoryLabel(selectedCategory)}` : 'total' }}
        </p>
      </div>

      <!-- Pinned Items Grid -->
      <div v-if="filteredItems.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="relative group bg-white rounded-lg shadow-md overflow-hidden"
        >
          <!-- Selection Button (private view only) -->
          <button
            v-if="enableSelection"
            @click="selectionStore.toggleSelection(item)"
            class="absolute top-3 right-3 z-20 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            :class="{ 'opacity-100': selectionStore.isSelected(item.id) }"
          >
            <Icon
              :name="
                selectionStore.isSelected(item.id)
                  ? 'mdi:check-circle'
                  : 'mdi:plus-circle-outline'
              "
              size="1.75rem"
              :class="{
                'text-blue-500': selectionStore.isSelected(item.id),
                'text-gray-500': !selectionStore.isSelected(item.id),
              }"
            />
          </button>

          <!-- Tile border if selected -->
          <div
            v-if="enableSelection"
            class="absolute inset-0 rounded-lg border-2 pointer-events-none z-10"
            :class="
              selectionStore.isSelected(item.id)
                ? 'border-blue-500'
                : 'border-transparent'
            "
          ></div>

          <!-- Pin Type Badge -->
          <div class="absolute top-3 left-3 z-20">
            <span class="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
              {{ getCategoryLabel(item.type) }}
            </span>
          </div>

          <!-- Content based on type -->
          <div class="p-6">
            <NuxtLinkLocale
              v-if="item.source_document_uid"
              :to="explorerLinkForDocument(item.source_document_uid)"
              class="mb-3 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 underline-offset-2 hover:underline"
            >
              <Icon name="mdi:open-in-new" size="1rem" />
              {{ $t('pins.openInExplorer') }}
            </NuxtLinkLocale>
            <!-- Article/Solution Type -->
            <div v-if="item.type === 'result'" class="space-y-3">
              <h3 class="font-bold text-lg text-gray-800 line-clamp-2">
                {{ item.title }}
              </h3>
              <p
                v-if="!item.source_document_uid && (item.body_kind === 'text_segment' || item.body_kind === 'document')"
                class="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1"
              >
                {{ $t('pins.sourceMissing') }}
              </p>
              <p v-if="item.notes" class="text-xs text-neutral-500 italic">
                {{ item.notes }}
              </p>
              <p v-if="item.data?.subtitle" class="text-gray-600 text-sm line-clamp-3">
                {{ item.data.subtitle }}
              </p>
              <div v-if="item.data?.sectors" class="flex flex-wrap gap-1">
                <span
                  v-for="sector in item.data.sectors.slice(0, 3)"
                  :key="sector"
                  class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {{ sector }}
                </span>
              </div>
            </div>

            <!-- Image Type -->
            <div v-else-if="item.type === 'image'" class="space-y-3">
              <h3 class="font-bold text-lg text-gray-800">
                {{ item.title }}
              </h3>
              <p v-if="item.notes" class="text-xs text-neutral-500 italic bg-yellow-50 p-1">
                {{ item.notes }}
              </p>
              <img
                :src="item.data?.src"
                :alt="item.data?.alt"
                class="w-full h-48 object-cover rounded-md"
              />
            </div>

            <!-- Website Type -->
            <div v-else-if="item.type === 'website'" class="space-y-3">
              <h3 class="font-bold text-lg text-gray-800">
                {{ item.title }}
              </h3>
              <p class="text-gray-600 text-sm line-clamp-3">
                {{ item.data?.description }}
              </p>
              <a
                :href="item.data?.url"
                target="_blank"
                class="inline-flex items-center text-teal-600 hover:text-teal-800 text-sm"
              >
                Visit Website
                <Icon name="mdi:open-in-new" class="ml-1" size="1rem" />
              </a>
            </div>

            <!-- Contact Type -->
            <div v-else-if="item.type === 'contact'" class="space-y-3">
              <h3 class="font-bold text-lg text-gray-800">
                {{ item.title }}
              </h3>
              <p v-if="item.notes" class="text-xs text-neutral-500 italic bg-yellow-50 p-1">
                {{ item.notes }}
              </p>
              <div class="space-y-2">
                <p v-if="item.data?.email" class="text-sm text-gray-600">
                  <Icon name="mdi:email" class="inline mr-2" size="1rem" />
                  {{ item.data.email }}
                </p>
                <p v-if="item.data?.phone" class="text-sm text-gray-600">
                  <Icon name="mdi:phone" class="inline mr-2" size="1rem" />
                  {{ item.data.phone }}
                </p>
                <p v-if="item.data?.organization" class="text-sm text-gray-600">
                  <Icon name="mdi:office-building" class="inline mr-2" size="1rem" />
                  {{ item.data.organization }}
                </p>
              </div>
            </div>

            <!-- Other/Generic Type -->
            <div v-else class="space-y-3">
              <h3 class="font-bold text-lg text-gray-800">
                {{ item.title }}
              </h3>
              <p v-if="item.notes" class="text-xs text-neutral-500 italic bg-yellow-50 p-1">
                {{ item.notes }}
              </p>
              <p v-if="item.data?.description" class="text-gray-600 text-sm line-clamp-3">
                {{ item.data.description }}
              </p>
              <div v-if="item.data?.tags" class="flex flex-wrap gap-1">
                <span
                  v-for="tag in item.data.tags.slice(0, 3)"
                  :key="tag"
                  class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Icon name="mdi:pin-off" size="4rem" class="mx-auto text-gray-400 mb-4" />
        <h3 class="text-xl font-semibold text-gray-600 mb-2">
          {{ selectedCategory === 'all' ? 'No pinned items' : `No ${getCategoryLabel(selectedCategory)} items` }}
        </h3>
        <p class="text-gray-500">
          {{ selectedCategory === 'all' 
            ? emptyAllMessage 
            : emptyCategoryMessage 
          }}
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePinnedSelectionStore } from '@/stores/selection'

const { t } = useI18n()
const localePath = useLocalePath()

function explorerLinkForDocument(documentUid: string) {
  return localePath({
    path: '/explorer/explorer',
    query: { document: documentUid },
  })
}

interface PinnedItem {
  id: string
  title: string
  type: 'result' | 'contact' | 'image' | 'website' | 'other'
  data: any
  notes?: string
  source_document_uid?: string | null
  body_kind?: string
}

const props = defineProps<{
  items: PinnedItem[]
  enableSelection?: boolean
  emptyAllMessage?: string
  emptyCategoryMessage?: string
}>()

const enableSelection = computed(() => props.enableSelection ?? true)
const emptyAllMessage = computed(() => props.emptyAllMessage ?? 'Start pinning items from the explorer to see them here.')
const emptyCategoryMessage = computed(() => props.emptyCategoryMessage ?? 'Try selecting a different category or pin some items.')

const selectionStore = usePinnedSelectionStore()

const categories = computed(() => [
  { label: 'All', value: 'all' },
  { label: 'Solutions', value: 'result' },
  { label: t('pins.boardCategoryFullPapers'), value: 'document' },
  { label: 'Contacts', value: 'contact' },
  { label: 'Images', value: 'image' },
  { label: 'Websites', value: 'website' },
  { label: 'Other Blocks', value: 'other' },
])

const selectedCategory = ref('all')

const filteredItems = computed(() => {
  if (selectedCategory.value === 'all') return props.items
  if (selectedCategory.value === 'document') {
    return props.items.filter((it) => it.body_kind === 'document')
  }
  return props.items.filter((it) => it.type === selectedCategory.value)
})

const getCategoryCount = (categoryValue: string) => {
  if (categoryValue === 'all') return props.items.length
  if (categoryValue === 'document') {
    return props.items.filter((it) => it.body_kind === 'document').length
  }
  return props.items.filter((it) => it.type === categoryValue).length
}

const getCategoryLabel = (categoryValue: string) => {
  const category = categories.value.find((cat) => cat.value === categoryValue)
  return category ? category.label : categoryValue
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>


