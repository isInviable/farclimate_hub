<script setup lang="ts">
import type { SkillItem } from '~/composables/useSkillsData'

defineProps<{
  item: SkillItem
}>()
</script>

<template>
  <article class="bg-white border border-neutral flex flex-col gap-6 items-end p-6">
    <div class="relative w-full aspect-358/269 overflow-hidden shrink-0">
      <img
        :src="item.image"
        :alt="item.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-black/20" />
    </div>

    <div class="flex flex-col gap-6 items-start w-full">
      <div class="flex gap-6 items-start w-full">
        <div class="flex flex-1 gap-2 items-center">
          <UIcon name="i-heroicons-calendar-days" class="size-4 text-neutral-darkest shrink-0" />
          <span class="font-mono text-[13px] leading-relaxed text-neutral-darkest">{{ item.date }}</span>
        </div>
        <div class="flex flex-1 gap-2 items-center">
          <UIcon name="i-heroicons-clock" class="size-4 text-neutral-darkest shrink-0" />
          <span class="font-mono text-[13px] leading-relaxed text-neutral-darkest">{{ item.readTime }}</span>
        </div>
      </div>

      <h3 class="font-display font-bold text-[22px] leading-[1.4] tracking-tight text-neutral-darkest w-full">
        {{ item.title }}
      </h3>

      <p class="font-mono font-light text-[13px] leading-relaxed text-neutral-darkest w-full">
        {{ item.description }}
      </p>
    </div>

    <NuxtLinkLocale
      :to="item.url"
      class="flex items-center gap-4 bg-neutral-darkest pl-4 shrink-0"
    >
      <span class="font-mono font-medium text-[13px] text-neutral-lightest">Read</span>
      <div class="bg-[#9e9e14] flex items-center justify-center size-10 shrink-0">
        <UIcon name="i-heroicons-arrow-down" class="size-6 text-white" />
      </div>
    </NuxtLinkLocale>
  </article>
</template>
