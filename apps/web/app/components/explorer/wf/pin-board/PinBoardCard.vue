<template>
  <div
    class="relative group bg-white rounded-lg shadow-md overflow-hidden border border-neutral-100"
  >
    <button
      v-if="enableSelection"
      type="button"
      class="absolute top-3 right-3 z-20 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      :class="{ 'opacity-100': selectionStore.isSelected(pin.id) }"
      @click="selectionStore.toggleSelection(selectionItem)"
    >
      <Icon
        :name="
          selectionStore.isSelected(pin.id)
            ? 'mdi:check-circle'
            : 'mdi:plus-circle-outline'
        "
        size="1.75rem"
        :class="{
          'text-blue-500': selectionStore.isSelected(pin.id),
          'text-gray-500': !selectionStore.isSelected(pin.id),
        }"
      />
    </button>
    <div
      v-if="enableSelection"
      class="absolute inset-0 rounded-lg border-2 pointer-events-none z-10"
      :class="
        selectionStore.isSelected(pin.id)
          ? 'border-blue-500'
          : 'border-transparent'
      "
    />

    <div class="absolute top-3 left-3 z-20">
      <span class="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
        {{ bodyKindLabel }}
      </span>
    </div>

    <div class="p-6 pt-14 space-y-3">
      <NuxtLink
        v-if="pin.source_document_uid"
        :to="explorerLinkForDocument(pin.source_document_uid)"
        class="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 underline-offset-2 hover:underline"
      >
        <Icon name="mdi:open-in-new" size="1rem" />
        {{ $t("pins.openInExplorer") }}
      </NuxtLink>

      <p
        v-if="
          !pin.source_document_uid &&
          (pin.body_kind === 'text_segment' || pin.body_kind === 'document')
        "
        class="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1"
      >
        {{ $t("pins.sourceMissing") }}
      </p>

      <h3 class="font-bold text-lg text-gray-900 line-clamp-2">
        {{ pin.source_title_snapshot?.trim() || $t("pins.noTitle") }}
      </h3>

      <PinBodyRenderer
        :body-kind="pin.body_kind"
        :data="bodyData"
      />

      <div v-if="pin.user_note?.trim()" class="pt-2 border-t border-neutral-100">
        <p class="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          {{ $t("pins.userNote") }}
        </p>
        <p class="text-sm text-neutral-700 whitespace-pre-wrap">
          {{ pin.user_note }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HumanPinRow } from "~/types/pins";
import { pinToSelectionItem } from "~/utils/pinSelection";
import PinBodyRenderer from "./PinBodyRenderer.vue";
import { usePinnedSelectionStore } from "@/stores/selection";

const props = defineProps<{
  pin: HumanPinRow
  enableSelection?: boolean
}>();

const { t, te } = useI18n();
const localePath = useLocalePath();
const selectionStore = usePinnedSelectionStore();

const enableSelection = computed(() => props.enableSelection ?? false);

const bodyData = computed(() => {
  const d = props.pin.body?.data;
  if (d && typeof d === "object" && !Array.isArray(d))
    return d as Record<string, unknown>;
  return {};
});

const selectionItem = computed(() => pinToSelectionItem(props.pin));

function explorerLinkForDocument(documentUid: string) {
  return localePath({
    path: "/explorer/explorer",
    query: { document: documentUid },
  });
}

const bodyKindLabel = computed(() => {
  const k = props.pin.body_kind || "unknown";
  const key = `pins.kinds.${k}`;
  return te(key) ? t(key) : t("pins.kinds.unknown");
});
</script>
