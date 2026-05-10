<template>
  <section class="relative bg-neutral-lightest">
    <div class="max-w-xl mx-auto py-6 px-4 space-y-6">
      <div v-for="hit in results" :key="hit.id">
        <ViewModeGridHitContext :document="hit.document">
          <ViewModeInstagramCard
            :document="hit.document"
            :username="getUsername(hit.document)"
            :location="getLocation(hit.document)"
            :title="getTitle(hit.document)"
            :subtitle="truncate(hit.document.subtitle, 200)"
            :pin-preview="instagramPinPreview(hit.document)"
            @open="handleDocumentClick(hit.document)"
          />
        </ViewModeGridHitContext>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ArticleDetail } from '~/types/search'

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
  return ''
}

const getTitle = (doc: ArticleDetail) => {
  if (doc.title) return doc.title
  return 'Unknown Title'
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
