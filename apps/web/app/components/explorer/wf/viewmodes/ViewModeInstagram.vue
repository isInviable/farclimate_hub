<template>
  <div class="max-w-xl mx-auto space-y-8">
    <div v-for="hit in results" :key="hit.id">
      <div class="bg-white border border-gray-200 rounded-lg shadow-md">
        <!-- Post Header -->
        <div class="flex items-center p-4 border-b border-gray-200">
          <div class="ml-3 flex-1">
            <span class="font-semibold text-sm">{{
              getUsername(hit.document)
            }}</span>
            <p class="text-xs text-gray-500">{{ getLocation(hit.document) }}</p>
          </div>
          <button type="button" class="text-gray-500">
            <Icon name="mdi:dots-horizontal" size="1.5rem" />
          </button>
        </div>

        <ViewModeInstagramCarousel
          :images="hit.document.images"
          @activate="handleDocumentClick(hit.document)"
        />

        <!-- Post Actions -->
        <div class="flex items-center p-3">
          <button
            type="button"
            class="mr-4 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Icon name="mdi:share-outline" size="1.75rem" />
          </button>
          <div class="ml-auto">
            <Pin
              :pin-title="getTitle(hit.document)"
              pin-type="result"
              :pin-data="hit.document"
            >
              <Icon
                name="mdi:bookmark-outline"
                size="1.75rem"
                class="text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              />
            </Pin>
          </div>
        </div>

        <!-- Post Caption -->
        <div class="px-4 pb-4">
          <p class="text-sm text-gray-700 mt-1">
            <span class="font-semibold block text-lg">{{
              getTitle(hit.document)
            }}</span>
            {{ truncate(hit.document.subtitle, 200) }}
          </p>
          <button
            type="button"
            class="text-xs text-gray-500 mt-2 cursor-pointer hover:underline text-left"
            @click="handleDocumentClick(hit.document)"
          >
            {{ t('viewModes.instagramViewMore') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetail } from '~/types/search'

const { t } = useI18n()

defineProps<{
  results: { id: string; document: ArticleDetail }[]
}>()

const emit = defineEmits<{
  'document-selected': [document: ArticleDetail]
}>()

const truncate = (text: string | undefined, length: number) => {
  if (text && text.length > length) {
    return text.slice(0, length) + '...'
  }
  return text ?? ''
}

const getUsername = (doc: ArticleDetail) => {
  if (doc.contact && typeof doc.contact === 'string') {
    let firstLine = doc.contact.split(/\r?\n/)[0].trim()
    if (firstLine.length > 64) {
      firstLine = firstLine.slice(0, 64) + '...'
    }
    return firstLine || 'Climate Shaper'
  }
  if (doc.sectors) {
    const raw =
      typeof doc.sectors === 'string' ? doc.sectors.split(',') : doc.sectors
    const first = raw[0]?.trim()
    if (first) return first
  }
  return 'Climate Shaper'
}

const getLocation = (doc: ArticleDetail) => {
  if (doc.geographic_characterisation) {
    if (doc.geographic_characterisation.city)
      return doc.geographic_characterisation.city
    if (doc.geographic_characterisation.countries)
      return doc.geographic_characterisation.countries
  }
  return 'Unknown Location'
}

const getTitle = (doc: ArticleDetail) => {
  if (doc.title) return doc.title
  return 'Unknown Title'
}

function handleDocumentClick(document: ArticleDetail) {
  emit('document-selected', document)
}
</script>
