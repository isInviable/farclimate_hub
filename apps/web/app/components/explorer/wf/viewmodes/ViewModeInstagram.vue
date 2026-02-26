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
          <button class="text-gray-500">
            <Icon name="mdi:dots-horizontal" size="1.5rem" />
          </button>
        </div>

        <!-- Post Image -->
        <img
          :src="hit.document.image_url"
          alt="Solution Image"
          class="w-full h-auto object-cover cursor-pointer"
          @error="handleImageError"
          @click="handleDocumentClick(hit.document)"
        />

        <!-- Post Actions -->
        <div class="flex items-center p-3">
          <button
            class="mr-4 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Icon name="mdi:share-outline" size="1.75rem" />
          </button>
          <div class="ml-auto">
            <Pin>
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
          <a
            @click="handleDocumentClick(hit.document)"
            class="text-xs text-gray-500 mt-2 inline-block cursor-pointer hover:underline"
          >
            View more...
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDocumentStore } from "@/stores/document";

const documentStore = useDocumentStore();

const props = defineProps({
  results: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['document-selected']);

const truncate = (text, length) => {
  if (text && text.length > length) {
    return text.slice(0, length) + "...";
  }
  return text;
};

const handleImageError = (event) => {
  event.target.src = "/img/img_placeholder.png";
};

const getUsername = (doc) => {
  if (doc.contact && typeof doc.contact === 'string') {
    // Take the first line (up to the first line break)
    let firstLine = doc.contact.split(/\r?\n/)[0].trim();
    // Limit to 64 characters
    if (firstLine.length > 64) {
      firstLine = firstLine.slice(0, 64) + '...';
    }
    return firstLine || "Climate Shaper";
  }
  if (doc.sectors) {
    const sectors = doc.sectors.split(",");
    return sectors[0].trim();
  }
  return "Climate Shaper";
};

const getLocation = (doc) => {
  if (doc.geographic_characterisation) {
    if (doc.geographic_characterisation.city)
      return doc.geographic_characterisation.city;
    if (doc.geographic_characterisation.countries)
      return doc.geographic_characterisation.countries;
  }
  return "Unknown Location";
};

const getTitle = (doc) => {
  if (doc.title) return doc.title;
  return "Unknown Title";
};

function handleDocumentClick(document) {
  emit('document-selected', document);
}
</script>
