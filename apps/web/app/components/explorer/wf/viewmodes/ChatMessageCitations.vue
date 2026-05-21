<template>
  <div v-if="showBlock" class="mt-3 border-t border-neutral-200 pt-2">
    <UPopover v-if="!loading && citations.length" :ui="{ content: 'p-2 max-w-sm' }">
      <UButton
        type="button"
        size="xs"
        color="neutral"
        variant="outline"
        trailing-icon="i-lucide-chevron-down"
        class="rounded-none font-mono text-xs font-bold uppercase tracking-wide"
      >
        {{ countLabel }}
      </UButton>
      <template #content>
        <ul class="flex flex-col gap-1">
          <li v-for="(c, i) in citations" :key="c.documentUid + i">
            <UButton
              type="button"
              variant="link"
              color="primary"
              class="h-auto justify-start px-1 py-1 text-left text-sm font-normal normal-case tracking-normal"
              @click="emit('open-article', c.documentUid)"
            >
              {{ c.title }}
            </UButton>
          </li>
        </ul>
      </template>
    </UPopover>
    <div
      v-else-if="loading"
      class="font-mono text-xs text-neutral-dark"
    >
      {{ $t("chat.referencesLoading") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatCitation } from "~/types/chat";

const props = defineProps<{
  citations: ChatCitation[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  "open-article": [documentUid: string];
}>();

const { t } = useI18n();

const showBlock = computed(
  () => props.loading || props.citations.length > 0,
);

const countLabel = computed(() =>
  t("chat.referencesCount", { count: props.citations.length }),
);
</script>
