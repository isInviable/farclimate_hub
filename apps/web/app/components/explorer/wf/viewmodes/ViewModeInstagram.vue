<template>
  <section class="relative bg-neutral-lightest">
    <ExplorerResultsToolbar
      v-if="results.length > 0"
      v-model:page="page"
      :total-count="results.length"
      :range-start="results.length ? 1 : 0"
      :range-end="results.length"
      :page-size="results.length || 1"
      :show-pagination="false"
      show-bulk-select
      :all-on-page-selected="sel.isAllSelected(pageSelectionItems)"
      @bulk-toggle="toggleSelectAllOnPage"
    />

    <div class=" columns-2xs gap-x-0.5">
      <div
        v-for="hit in results"
        :key="hit.id"
        class="break-inside-avoid mb-0.5"
      >
        <ViewModeGridHitContext :document="hit.document">
          <ViewModeInstagramCard
            :document="hit.document"
            :username="getUsername(hit.document)"
            :location="getLocation(hit.document)"
            :title="getTitle(hit.document)"
            :subtitle="truncate(hit.document.subtitle, 200)"
            :pin-preview="instagramPinPreview(hit.document)"
            :selected="isSelected(hit.id)"
            @open="handleDocumentClick(hit.document)"
            @toggle-select="toggleSelection(hit)"
          />
        </ViewModeGridHitContext>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useSearchSelectionStore } from '@/stores/searchSelection'
import type { SearchSelectedItem } from '@/stores/searchSelection'
import type { ArticleDetail } from '~/types/search'

type InstagramHit = { id: string; document: ArticleDetail }

const props = defineProps<{
  results: InstagramHit[]
}>()

const emit = defineEmits<{
  'document-selected': [document: ArticleDetail]
}>()

const sel = useSearchSelectionStore()
const page = ref(1)

const pageSelectionItems = computed<SearchSelectedItem[]>(() =>
  props.results.map((h) => ({
    id: h.id,
    title: h.document?.title ?? '',
    document: h.document,
  }))
)

const isSelected = (id: string) => sel.isSelected(id)

function toggleSelection(hit: InstagramHit) {
  sel.toggle({
    id: hit.id,
    title: hit.document?.title || '',
    document: hit.document,
  })
}

function toggleSelectAllOnPage() {
  const items = pageSelectionItems.value
  if (items.length === 0) return
  if (sel.isAllSelected(items)) sel.removeByIds(items.map((i) => i.id))
  else sel.mergeAdd(items)
}

const truncate = (text: string | undefined, length: number) => {
  if (text && text.length > length) {
    return text.slice(0, length) + '...'
  }
  return text ?? ''
}

const { t } = useI18n()

const getUsername = (doc: ArticleDetail) => {
  if (doc.contact && typeof doc.contact === 'string') {
    let firstLine = doc.contact.split(/\r?\n/)[0].trim()
    if (firstLine.length > 64) {
      firstLine = firstLine.slice(0, 64) + '...'
    }
    return firstLine || t('viewModes.instagramClimateShaper')
  }
  if (doc.sectors) {
    const raw =
      typeof doc.sectors === 'string' ? doc.sectors.split(',') : doc.sectors
    const first = raw[0]?.trim()
    if (first) return first
  }
  return t('viewModes.instagramClimateShaper')
}

const getLocation = (doc: ArticleDetail) => {
  if (doc.geographic_characterisation) {
    if (doc.geographic_characterisation.city)
      return doc.geographic_characterisation.city
    if (doc.geographic_characterisation.countries)
      return doc.geographic_characterisation.countries
  }
  return ''
}

const getTitle = (doc: ArticleDetail) => {
  if (doc.title) return doc.title
  return t('viewModes.instagramUnknownTitle')
}

function instagramPinPreview(doc: ArticleDetail): string {
  const title = getTitle(doc)
  const sub = doc.subtitle?.trim()
  if (!sub) return title
  return `${title}\n${truncate(sub, 200)}`
}

function handleDocumentClick(document: ArticleDetail) {
  emit('document-selected', document)
}
</script>
