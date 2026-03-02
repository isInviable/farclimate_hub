<script setup lang="ts">
interface CategoryItem {
  label: string
  count?: number
}

defineProps<{
  trainingCategories: CategoryItem[]
  filterOptions: CategoryItem[]
}>()

const selectedCategories = ref<string[]>([])
const selectedFilters = ref<string[]>([])
</script>

<template>
  <aside class="bg-white border-r border-neutral-light w-[365px] shrink-0 flex flex-col items-start pb-6 pl-20 pr-5 pt-16 self-stretch">
    <div class="flex flex-col gap-6 items-start pb-10 w-full">
      <h2 class="font-display font-bold text-[22px] leading-[1.4] tracking-tight text-neutral-darkest">
        All trainings
      </h2>
      <UCheckbox
        v-for="cat in trainingCategories"
        :key="cat.label"
        v-model="selectedCategories"
        :value="cat.label"
        :label="`${cat.label}${cat.count !== undefined ? ` (${cat.count})` : ''}`"
        color="neutral"
        class="font-mono text-[13px] text-neutral-darkest"
      />
    </div>

    <div class="flex flex-col gap-6 items-start pb-10 w-full">
      <h2 class="font-display font-bold text-[22px] leading-[1.4] tracking-tight text-neutral-darkest">
        Filter by
      </h2>
      <UCheckbox
        v-for="opt in filterOptions"
        :key="opt.label"
        v-model="selectedFilters"
        :value="opt.label"
        :label="opt.label"
        color="neutral"
        class="font-mono text-[13px] text-neutral-darkest"
      />
    </div>
  </aside>
</template>
