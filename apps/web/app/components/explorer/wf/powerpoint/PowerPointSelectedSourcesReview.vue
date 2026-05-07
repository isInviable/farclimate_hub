<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ $t("powerpoint.wizard.selectedItemsTitle") }}
          </h3>
          <p class="text-sm text-gray-500">
            {{
              $t("powerpoint.wizard.selectedItemsSummary", {
                count: sources.length,
                max,
                words,
              })
            }}
          </p>
        </div>
        <UBadge color="neutral" variant="soft">
          {{
            $t("powerpoint.wizard.contextSize", {
              current: chars,
              max: maxChars,
            })
          }}
        </UBadge>
      </div>
    </template>

    <div v-if="sources.length === 0" class="text-sm text-gray-500">
      {{ $t("powerpoint.wizard.noSelection") }}
    </div>
    <div v-else class="divide-y divide-gray-100">
      <article
        v-for="item in sources"
        :key="item.source.id"
        class="py-3 first:pt-0 last:pb-0"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="font-medium text-gray-900">
            {{ item.title }}
          </h4>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <UBadge v-if="item.imageSrc" color="primary" variant="soft">
              {{ $t("powerpoint.wizard.imageAvailable") }}
            </UBadge>
            <span>
              {{
                $t("powerpoint.wizard.itemStats", {
                  words: item.wordCount,
                  chars: item.textLength,
                })
              }}
            </span>
          </div>
        </div>
        <p class="mt-1 line-clamp-2 text-sm text-gray-600">
          {{ item.source.text || $t("powerpoint.wizard.noTextForItem") }}
        </p>
      </article>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { PowerPointSourcePreview } from "~/utils/powerPointSelection"

defineProps<{
  sources: PowerPointSourcePreview[]
  max: number
  maxChars: number
  words: number
  chars: number
}>()
</script>
