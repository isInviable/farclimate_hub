<script setup lang="ts">
withDefaults(
  defineProps<{
    links: Array<{ label: string; href?: string }>
    columns?: 1 | 2
  }>(),
  { columns: 1 }
)
</script>

<template>
  <ul
    class="grid gap-0 border border-neutral"
    :class="columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'"
  >
    <li
      v-for="(link, i) in links"
      :key="i"
      class="border-b border-neutral last:border-b-0"
    >
      <component
        :is="link.href ? 'a' : 'span'"
        :href="link.href"
        class="flex items-center justify-between gap-4 px-4 py-4 font-mono text-sm text-neutral-darkest hover:bg-neutral-lightest transition-colors"
      >
        <span class="inline-flex items-center gap-3">
          <UIcon name="material-symbols:description-outline" class="size-5 shrink-0" />
          {{ link.label }}
        </span>
        <UIcon name="material-symbols:chevron-right" class="size-5 shrink-0" />
      </component>
    </li>
  </ul>
</template>
