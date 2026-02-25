<template>
  <ActionBarBase>
    <template #left>
      <div class="flex items-center gap-3">
        <UButton
          variant="outline"
          color="primary"
          size="sm"
          class="rounded-full group"
          @click="selection.clear()"
          trailing-icon="mdi:close"
          :ui="{ trailingIcon: selection.count === 0 ? 'hidden' : 'opacity-50 group-hover:opacity-100' }"
        >
          {{ selection.count }}
        </UButton>
        <span class="hidden md:block text-xs">selected results</span>
      </div>
    </template>

    <UButton variant="outline" @click="$emit('open-chat')">
      <Icon name="mdi:chat-processing" class="mr-2 h-4 w-4" />
      Chat with results
    </UButton>
    <UButton variant="outline" @click="$emit('open-insights')">
      <Icon name="mdi:lightbulb-on" class="mr-2 h-4 w-4" />
      Top insights
    </UButton>
    <UButton variant="outline" @click="$emit('open-mindmap')">
      <Icon name="mdi:source-branch" class="mr-2 h-4 w-4" />
      Mind map
    </UButton>
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
