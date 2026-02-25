<template>
  <div
    ref="blockElement"
    class="relative group cursor-pointer transition-all duration-200 select-none"
    :class="{
      'ring-2 ring-slate-500 shadow-lg': isSelected,
      'hover:ring-2 hover:ring-slate-300 hover:shadow-md': !isSelected,
    }"
    @click="toggleSelected"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    tabindex="0"
    :aria-pressed="isSelected"
  >
    <div
      class=" p-4 bg-white rounded-md border border-gray-200 h-full w-full"
    >
      <div class="h-full w-full flex flex-col gap-2">
        <!-- TITLE -->
        <div class="flex items-center  gap-2">
          <Icon :name="icon" class="text-xl text-gray-500 shrink-0" />
          <div
            class="flex items-center gap-1 font-mono text-xs text-gray-500 mb-1 truncate"
          >
            {{ label }}
            <Icon
              v-if="showAiIcon"
              name="eos-icons:ai"
              class="w-6 h-6 ml-1 text-sky-500 align-middle"
            />
          </div>
        </div>
        <!-- CONTENT -->
        <div v-if="isHtml" v-html="value" class="text-sm" />
        <a
          v-else-if="isLink && value"
          :href="value"
          target="_blank"
          class="text-blue-600 underline text-sm break-all"
          >{{ value }}</a
        >
        <div
          v-else-if="$slots.default"
          class="text-sm break-words h-full w-full"
        >
          <slot></slot>
        </div>
        <div v-else class="text-sm break-words">{{ value }}</div>
      </div>
      <button
        v-show="isHovered"
        @click.stop="handlePin"
        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full shadow-md p-1 hover:bg-gray-50"
        :class="{ 'opacity-100': isPinned }"
      >
        <Icon name="mdi:pin" class="text-md text-black" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { usePin } from "@/composables/usePin";

const props = defineProps({
  label: String,
  value: [String, Number],
  icon: String,
  isHtml: Boolean,
  isLink: Boolean,
  showAiIcon: Boolean,
});

const { pinContent } = usePin();
const blockElement = ref(null);
const isSelected = ref(false);
const isHovered = ref(false);
const isPinned = ref(false);

function toggleSelected() {
  isSelected.value = !isSelected.value;
}

function handlePin() {
  if (!isPinned.value && blockElement.value) {
    pinContent(blockElement.value);
    isPinned.value = true;
  }
  // Note: For unpinning, we'd need to track pinId, but for now just visual feedback
}
</script>

<style scoped>
.group:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
}
</style>



