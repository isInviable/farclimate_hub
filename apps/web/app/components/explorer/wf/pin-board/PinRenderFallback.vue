<template>
  <div class="space-y-2">
    <EditorialEyebrow color="muted">
      {{ $t("pins.fallbackKind", { kind: bodyKind }) }}
    </EditorialEyebrow>
    <div class="bg-warm-neutral-100 border border-neutral-darkest p-3 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
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
