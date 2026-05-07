<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ presentation.title }}
          </h3>
          <p v-if="presentation.subtitle" class="text-sm text-gray-500">
            {{ presentation.subtitle }}
          </p>
        </div>
        <UBadge color="primary" variant="soft">
          {{
            $t("powerpoint.wizard.slideCount", {
              count: presentation.slides.length,
            })
          }}
        </UBadge>
      </div>
    </template>

    <div class="grid gap-3">
      <UCard
        v-for="(slide, index) in presentation.slides"
        :key="`${slide.type}-${index}`"
        variant="subtle"
      >
        <div class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <UBadge color="neutral" variant="soft">
                {{ index + 1 }}
              </UBadge>
              <h4 class="font-medium text-gray-900">
                {{ slide.title }}
              </h4>
            </div>
            <UBadge color="primary" variant="soft">
              {{ slide.type }}
            </UBadge>
          </div>

          <p v-if="'subtitle' in slide && slide.subtitle" class="text-sm text-gray-600">
            {{ slide.subtitle }}
          </p>

          <ul v-if="'bullets' in slide" class="list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li v-for="bullet in slide.bullets" :key="bullet">
              {{ bullet }}
            </li>
          </ul>

          <p v-if="'image' in slide" class="text-xs text-gray-500">
            {{
              $t("powerpoint.wizard.imageReference", {
                sourceId: slide.image.sourceId,
              })
            }}
          </p>
        </div>
      </UCard>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { PresentationStructure } from "~/types/presentationGeneration"

defineProps<{
  presentation: PresentationStructure
}>()
</script>
