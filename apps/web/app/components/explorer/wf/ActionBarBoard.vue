<template>
  <ActionBarBase>
    <template #left>
      <button
        type="button"
        class="flex items-center justify-center min-w-[28px] h-5 px-1.5 bg-primary-600 text-neutral-lightest font-mono text-2xs font-bold tabular-nums hover:bg-primary-500 transition-colors"
        :aria-label="$t('viewModes.clearSelection', 'Clear selection')"
        @click="selectionStore.clearSelection()"
      >
        {{ selectionStore.selectionCount }}
      </button>
      <span class="hidden md:inline font-mono text-2xs uppercase tracking-[0.14em] text-neutral-lightest/80">
        selected
      </span>
      <button
        v-if="selectionStore.selectionCount > 0"
        type="button"
        class="text-neutral-lightest/60 hover:text-neutral-lightest transition-colors"
        :aria-label="$t('viewModes.clearSelection', 'Clear selection')"
        @click="selectionStore.clearSelection()"
      >
        <Icon name="mdi:close" class="h-3.5 w-3.5" />
      </button>
    </template>

    <button
      type="button"
      class="flex items-center gap-2 px-4 h-11 text-neutral-lightest hover:bg-neutral-lightest/10 transition-colors"
      @click="$emit('open-chat')"
    >
      <Icon name="mdi:chat-processing" class="h-4 w-4 text-primary-400" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em]">
        Chat with selection
      </span>
    </button>
    <button
      type="button"
      class="flex items-center gap-2 px-4 h-11 text-neutral-lightest hover:bg-neutral-lightest/10 transition-colors"
      @click="$emit('open-insights')"
    >
      <Icon name="mdi:lightbulb-on" class="h-4 w-4 text-primary-400" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em]">
        Top insights
      </span>
    </button>

    <USelect
      v-model="selectedAction"
      :items="actionOptions"
      placeholder="More actions..."
      class="min-w-48"
      :ui="{
        base: 'rounded-none bg-transparent border-0 text-neutral-lightest font-mono text-2xs uppercase tracking-[0.14em] hover:bg-neutral-lightest/10 focus:ring-0 h-11',
      }"
      size="sm"
      arrow
    />
  </ActionBarBase>
</template>

<script setup lang="ts">
import ActionBarBase from "./ActionBarBase.vue";
import { ref, watch } from "vue";
import { usePinnedSelectionStore } from "@/stores/selection";

const selectionStore = usePinnedSelectionStore();
const { t } = useI18n();

const selectedAction = ref("");

const emit = defineEmits<{
  (e: "open-chat"): void;
  (e: "open-insights"): void;
  (e: "open-powerpoint"): void;
  (e: "open-podcast"): void;
  (e: "open-video"): void;
}>();

const actionOptions = computed(() => [
  {
    label: t("powerpoint.actions.makePresentation"),
    value: "presentation",
    icon: "mdi:presentation",
  },
  {
    label: "Create podcast",
    value: "podcast",
    icon: "mdi:podcast",
  },
  {
    label: "Create video summary",
    value: "video",
    icon: "mdi:video",
  },
]);

watch(selectedAction, (value) => {
  if (!value) return;

  switch (value) {
    case "presentation":
      emit("open-powerpoint");
      break;
    case "podcast":
      emit("open-podcast");
      break;
    case "video":
      emit("open-video");
      break;
  }

  selectedAction.value = "";
});
</script>
