<template>
  <p class="text-sm text-neutral-600">
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
