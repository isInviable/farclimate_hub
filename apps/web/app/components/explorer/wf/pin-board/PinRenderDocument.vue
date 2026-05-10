<template>
  <p class="font-sans text-sm text-neutral-dark">
    {{ $t("pins.documentPinBodyHint") }}
  </p>
</template>

<script setup lang="ts">
/** Full-document pins use title + explorer link on the card; body is intentionally minimal. */
defineProps<{
  data?: Record<string, unknown>;
  bodyKind?: string;
}>();
</script>
