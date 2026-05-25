<template>
  <article
    :class="[
      'border border-neutral-darkest/20 overflow-hidden transition-colors',
      selected ? 'bg-neutral-300' : 'bg-neutral-lightest',
    ]"
  >
    <CapturableBlock
      pin-kind="text_segment"
      :title="title"
      :preview="pinPreview"
      :payload="{ markdown: pinPreview }"
      :chrome="false"
      source-view="explorer-instagram"
      class="block w-full border-b border-neutral-darkest/10"
    >
      <div class="flex items-start gap-2 px-3 py-2.5 pr-10">
        <UCheckbox
          :model-value="selected"
          color="primary"
          size="xs"
          class="mt-0.5 shrink-0"
          @click.stop
          @update:model-value="$emit('toggle-select')"
        />
        <div class="flex-1 min-w-0">
          <p class="font-sans font-semibold text-sm text-neutral-darkest truncate">
            {{ username }}
          </p>
          <EditorialEyebrow v-if="location" color="muted" class="block truncate">
            {{ location }}
          </EditorialEyebrow>
        </div>
      </div>
    </CapturableBlock>

    <ViewModeInstagramCarousel
      :images="document.images"
      @activate="$emit('open')"
    />

    <div class="px-3 pt-2 pb-3">
      <button
        type="button"
        class="w-full text-left cursor-pointer group"
        @click="$emit('open')"
      >
        <p
          class="font-display font-bold text-base leading-snug text-neutral-darkest group-hover:underline"
        >
          {{ title }}
        </p>
        <p
          v-if="subtitle"
          class="text-sm text-neutral-dark leading-relaxed mt-1 line-clamp-4"
        >
          {{ subtitle }}
        </p>
        <span
          class="font-mono uppercase text-2xs tracking-[0.14em] text-neutral-dark group-hover:text-neutral-darkest transition-colors inline-block mt-2"
        >
          {{ $t('viewModes.instagramViewMore') }}
        </span>
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
  selected: boolean
}>()

defineEmits<{
  open: []
  'toggle-select': []
}>()
</script>
