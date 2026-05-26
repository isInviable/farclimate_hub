<script setup lang="ts">
interface SectorItem {
  src: string
  alt: string
  caption: string
}

defineProps<{
  items: SectorItem[]
}>()
</script>

<template>
  <div class="not-prose my-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
    <figure
      v-for="(item, index) in items"
      :key="index"
      class="m-0 flex flex-col gap-3"
    >
      <img
        :src="item.src"
        :alt="item.alt"
        class="h-36 w-full object-contain object-center sm:h-32"
        loading="lazy"
      />
      <figcaption class="m-0 font-mono text-sm font-light leading-snug text-neutral-700">
        {{ item.caption }}
      </figcaption>
    </figure>
  </div>
</template>
