<script setup lang="ts">
defineProps<{
  quote: string
  attribution: string
}>()
</script>

<template>
  <section class="text-neutral-lightest">
    <div class="max-w-4xl">
      <div class="flex flex-col gap-6">
        <UIcon name="material-symbols:format-quote" class="size-12 text-neutral-light opacity-80" />
        <blockquote class="font-mono text-xl leading-relaxed italic">
          {{ quote }}
        </blockquote>
        <p class="font-mono text-sm text-neutral-light">
          {{ attribution }}
        </p>
      </div>
    </div>
  </section>
</template>
