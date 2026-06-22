<template>
  <div class="mx-auto max-w-6xl pt-9 pb-8">
    <ul class="divide-y divide-neutral-lighter">
      <li
        v-for="pin in pins"
        :key="pin.id"
        class="py-8 first:pt-0 last:pb-0"
      >
        <UBadge
          :color="pinBodyKindBadgeColor(pin.body_kind)"
          variant="subtle"
          size="sm"
          class="mb-4"
        >
          {{ pinKindLabel(pin.body_kind) }}
        </UBadge>

        <PinBodyRenderer
          :body-kind="pin.body_kind"
          :data="bodyDataFor(pin)"
        />

        <div
          v-if="pin.user_note?.trim()"
          class="mt-4 border-t border-neutral-lighter pt-4"
        >
          <p
            class="font-mono text-2xs font-bold uppercase tracking-widest text-neutral-dark"
          >
            {{ $t("pins.userNote") }}
          </p>
          <p class="mt-2 font-sans text-sm text-neutral-darker whitespace-pre-wrap">
            {{ pin.user_note }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { HumanPinRow } from "~/types/pins";
import { pinBodyKindBadgeColor } from "~/utils/pinBodyKindBadge";
import PinBodyRenderer from "~/components/explorer/wf/pin-board/PinBodyRenderer.vue";

defineProps<{
  pins: HumanPinRow[];
}>();

const { t, te } = useI18n();

function pinKindLabel(kind: string): string {
  const key = `pins.kinds.${kind || "unknown"}`;
  return te(key) ? t(key) : t("pins.kinds.unknown");
}

function bodyDataFor(pin: HumanPinRow): Record<string, unknown> {
  const d = pin.body?.data;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    return d as Record<string, unknown>;
  }
  return {};
}
</script>
