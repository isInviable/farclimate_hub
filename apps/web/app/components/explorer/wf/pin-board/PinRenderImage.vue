<template>
  <div class="space-y-2">
    <img
      v-if="src"
      :src="src"
      :alt="alt || $t('pins.imageAlt')"
      class="w-full max-h-64 object-contain border border-neutral-darkest bg-warm-neutral-100"
    />
    <p v-else class="font-sans text-sm text-neutral-dark">
      {{ $t("pins.imagePlaceholder") }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Record<string, unknown>
}>();

const src = computed(() =>
  typeof props.data.src === "string" ? props.data.src : ""
);
const alt = computed(() =>
  typeof props.data.alt === "string" ? props.data.alt : ""
);
</script>
