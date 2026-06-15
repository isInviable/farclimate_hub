<template>
  <ActionBarBase variant="accent">
    <template #left>
      <button
        type="button"
        class="flex items-center justify-center min-w-[28px] h-5 px-1.5 bg-neutral-lightest text-neutral-darkest font-mono text-2xs font-bold tabular-nums hover:bg-neutral-lightest/90 transition-colors"
        :aria-label="$t('viewModes.clearSelection', 'Clear selection')"
        @click="selection.clear()"
      >
        {{ selection.count }}
      </button>
      <span class="hidden md:inline font-mono text-2xs uppercase tracking-[0.14em] text-neutral-lightest">
        {{ $t('listActions.selectedLabel') }}
      </span>
      <button
        v-if="selection.count > 0"
        type="button"
        class="text-neutral-lightest/70 hover:text-neutral-lightest transition-colors"
        :aria-label="$t('viewModes.clearSelection', 'Clear selection')"
        @click="selection.clear()"
      >
        <Icon name="mdi:close" class="h-3.5 w-3.5" />
      </button>
    </template>

    <button
      type="button"
      class="flex items-center gap-2 px-4 h-11 text-neutral-lightest hover:bg-neutral-lightest/10 transition-colors"
      @click="$emit('open-chat')"
    >
      <Icon name="mdi:chat-processing" class="h-4 w-4 text-neutral-lightest" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em]">
        {{ $t('listActions.chatWithResults') }}
      </span>
    </button>
    <button
      type="button"
      class="flex items-center gap-2 px-4 h-11 text-neutral-lightest hover:bg-neutral-lightest/10 transition-colors"
      @click="$emit('open-insights')"
    >
      <Icon name="mdi:lightbulb-on" class="h-4 w-4 text-neutral-lightest" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em]">
        {{ $t('listActions.topInsights') }}
      </span>
    </button>
    <button
      type="button"
      class="flex items-center gap-2 px-4 h-11 text-neutral-lightest hover:bg-neutral-lightest/10 transition-colors"
      @click="$emit('open-mindmap')"
    >
      <Icon name="mdi:source-branch" class="h-4 w-4 text-neutral-lightest" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em]">
        {{ $t('viewModes.mindmap') }}
      </span>
    </button>
  </ActionBarBase>
</template>

<script setup lang="ts">
import ActionBarBase from "./ActionBarBase.vue";
import { useSearchSelectionStore } from "@/stores/searchSelection";

const selection = useSearchSelectionStore();

defineEmits<{
  (e: "open-chat"): void;
  (e: "open-insights"): void;
  (e: "open-mindmap"): void;
}>();
</script>
