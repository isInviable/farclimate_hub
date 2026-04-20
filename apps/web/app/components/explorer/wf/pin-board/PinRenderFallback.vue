<template>
  <div class="space-y-2">
    <p class="text-xs text-neutral-500">
      {{ $t("pins.fallbackKind", { kind: bodyKind }) }}
    </p>
    <div class="rounded-md bg-neutral-50 border border-neutral-200 p-3 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
      <pre class="whitespace-pre-wrap break-words">{{ preview }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Record<string, unknown>
  bodyKind: string
}>();

const preview = computed(() => {
  try {
    const s = JSON.stringify(props.data, null, 2);
    return s.length > 4000 ? `${s.slice(0, 4000)}\n…` : s;
  } catch {
    return String(props.data);
  }
});
</script>
