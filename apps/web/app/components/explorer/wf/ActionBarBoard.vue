<template>
  <ActionBarBase>
    <template #left>
      <div class="flex items-center gap-3">
        <uButton
          variant="outline"
          color="primary"
          size="sm"
          class="rounded-full group"
          @click="selectionStore.clearSelection()"
          trailing-icon="mdi:close"
          :ui="{ trailingIcon: selectionStore.selectionCount === 0 ? 'hidden' : 'opacity-50 group-hover:opacity-100' }"
        >
          {{ selectionStore.selectionCount }}
        </uButton>
        <span class="hidden md:block text-xs">selected items</span>
      </div>
    </template>

    <UButton variant="outline" @click="$emit('open-chat')">
      <Icon name="mdi:chat-processing" class="mr-2 h-4 w-4" />
      Chat with selection
    </UButton>
    <UButton variant="outline" @click="$emit('open-insights')">
      <Icon name="mdi:lightbulb-on" class="mr-2 h-4 w-4" />
      Top insights
    </UButton>

    <USelect
      v-model="selectedAction"
      :items="actionOptions"
      placeholder="More actions..."
      class="min-w-48"
      variant="outline"
      color="primary"
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

const selectedAction = ref("");

// Define emits
const emit = defineEmits<{
  (e: "open-chat"): void;
  (e: "open-insights"): void;
  (e: "open-podcast"): void;
  (e: "open-video"): void;
}>();

// Action options for USelect
const actionOptions = [
  {
    label: "Make presentation",
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
];

// Handle action selection
watch(selectedAction, (value) => {
  if (!value) return;

  switch (value) {
    case "presentation":
      navigateTo("/presentation");
      break;
    case "podcast":
      // Emit event so parent can open a Nuxt UI modal
      // rather than using the legacy dialog store
      // @ts-ignore - emit is available in script setup
      emit("open-podcast");
      break;
    case "video":
      // @ts-ignore
      emit("open-video");
      break;
  }

  // Reset selection
  selectedAction.value = "";
});

// Note: Video/Podcast modals are now handled by the parent page via Nuxt UI modals
</script>
