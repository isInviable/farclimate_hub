<template>
  <div
    ref="pinWrapper"
    class="pin-wrapper relative group w-full"
    :class="{ 'pin-active': isPinned }"
  >
    <slot></slot>
    <UPopover arrow v-model:open="isPopoverOpen">
      <UButton
        @click="handlePin"
        icon="mdi:pin"
        variant="ghost"
        color="primary"
        class="cursor-pointer pin-button absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1 rounded-full shadow-md hover:bg-gray-50"
        :class="{ 'opacity-100': isPinned }"
      >
      </UButton>
      <template #content>
        <div class="flex flex-col gap-2 px-4 py-4">
          <UTextarea
            v-model="pinNotes"
            placeholder="Add notes to this pin"
            size="lg"
            max-rows="8"
            class="w-72 "
          />
          <UButton @click="isPopoverOpen = false" class="cursor-pointer" color="neutral">Save</UButton>
        </div>
      </template>
    </UPopover>
  </div>
</template>

<script setup lang="ts">
import { usePin } from "@/composables/usePin";
import { usePinsStore } from "@/stores/pins";

const props = defineProps<{
  contentSelector?: string;
  pinId?: string;
  pinTitle?: string;
  pinType?: 'result' | 'contact' | 'image' | 'website' | 'other';
  pinData?: any;
}>();

const emit = defineEmits<{
  (e: "pinned"): void;
  (e: "unpinned"): void;
}>();

const { pinContent } = usePin();
const pinsStore = usePinsStore();
const isPinned = ref(false);
const pinId = ref<string | null>(null);
const contentElement = ref<HTMLElement | null>(null);
const pinWrapper = ref<HTMLElement | null>(null);
const pinNotes = ref("");
const isPopoverOpen = ref(false);

watch(
  () => isPopoverOpen.value,
  (newValue, oldValue) => {
    if (!newValue && isPinned.value && pinId.value) {
      console.log("Updating pin notes", pinId.value, pinNotes.value);
      pinsStore.updatePinNotes(pinId.value, pinNotes.value);
    }
  }
);

onMounted(() => {
  if (pinWrapper.value) {
    // Get the content element based on selector or default to the first child
    contentElement.value = props.contentSelector
      ? (pinWrapper.value.querySelector(props.contentSelector) as HTMLElement)
      : (pinWrapper.value.firstElementChild as HTMLElement);
  }
});

const handlePin = () => {
  if (!contentElement.value) return;

  if (!isPinned.value) {
    pinId.value = pinContent(
      contentElement.value,
      {
        id: props.pinId,
        title: props.pinTitle,
        type: props.pinType,
        data: props.pinData,
        notes: pinNotes.value
      }
    );
    isPinned.value = true;
    emit("pinned");
  } else {
    if (pinId.value) {
      pinsStore.unpinItem(pinId.value);
      pinId.value = null;
    }
    isPinned.value = false;
    emit("unpinned");
  }
};
</script>

<style scoped>
.pin-wrapper {
  display: inline-block;
}

.pin-active {
  position: relative;
}
</style>
