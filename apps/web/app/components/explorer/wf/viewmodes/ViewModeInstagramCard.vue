<template>
  <article class="border border-neutral-darkest bg-neutral-lightest">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 py-3 border-b border-neutral-darkest/15">
      <div class="flex-1 min-w-0">
        <p class="font-sans font-semibold text-sm text-neutral-darkest truncate">
          {{ username }}
        </p>
        <EditorialEyebrow v-if="location" color="muted" class="block truncate">
          {{ location }}
        </EditorialEyebrow>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        size="xs"
        :aria-label="$t('viewModes.instagramViewMore')"
        @click.stop
      >
        <Icon name="mdi:dots-horizontal" size="1.25rem" />
      </UButton>
    </div>

    <!-- Carousel -->
    <ViewModeInstagramCarousel
      :images="document.images"
      @activate="$emit('open')"
    />

    <!-- Actions -->
    <div class="flex items-center gap-1 px-3 py-2 border-t border-neutral-darkest/15">
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        @click.stop
      >
        <Icon name="mdi:share-outline" size="1.5rem" />
      </UButton>

      <div class="ml-auto">
        <CapturableBlock
          pin-kind="text_segment"
          :title="title"
          :preview="pinPreview"
          :payload="{ markdown: pinPreview }"
          :chrome="false"
          source-view="explorer-instagram"
          class="relative inline-flex"
        >
          <template #pin="{ openCapture, isPinned, isSaving }">
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              :disabled="isSaving"
              :aria-label="$t('pins.capture.buttonAria')"
              @click.stop="openCapture"
            >
              <Icon
                :name="isPinned ? 'mdi:bookmark' : 'mdi:bookmark-outline'"
                size="1.5rem"
                :class="isPinned ? 'text-primary-600' : 'text-neutral-darkest'"
              />
            </UButton>
          </template>
          <span class="sr-only">{{ pinPreview }}</span>
        </CapturableBlock>
      </div>
    </div>

    <!-- Caption -->
    <div class="px-4 pt-1 pb-4">
      <p class="font-display font-bold text-lg leading-tight text-neutral-darkest">
        {{ title }}
      </p>
      <p v-if="subtitle" class="text-sm text-neutral-dark leading-relaxed mt-1">
        {{ subtitle }}
      </p>
      <button
        type="button"
        class="font-mono uppercase text-2xs tracking-[0.14em] text-neutral-dark hover:text-neutral-darkest transition-colors cursor-pointer text-left mt-2"
        @click="$emit('open')"
      >
        {{ $t('viewModes.instagramViewMore') }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ArticleDetail } from '~/types/search'

defineProps<{
  document: ArticleDetail
  username: string
  location: string
  title: string
  subtitle: string
  pinPreview: string
}>()

defineEmits<{
  open: []
}>()
</script>
