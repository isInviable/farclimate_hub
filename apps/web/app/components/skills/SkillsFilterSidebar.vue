<script setup lang="ts">
interface CategoryItem {
  label: string
  slug?: string
  count?: number
}

defineProps<{
  trainingCategories: CategoryItem[]
  filterOptions: CategoryItem[]
}>()

const selectedCategories = defineModel<string[]>('selectedCategories', { default: [] })
const selectedFilters = ref<string[]>([])

function toggleSelection(values: string[], value: string, selected: boolean) {
  if (selected && !values.includes(value)) {
    values.push(value)
  } else if (!selected) {
    const index = values.indexOf(value)
    if (index >= 0) values.splice(index, 1)
  }
}
</script>

<template>
  <aside class="bg-white border-r border-neutral-light w-[365px] shrink-0 flex flex-col items-start pb-6 pl-20 pr-5 pt-16 self-stretch">
    <div class="flex flex-col gap-6 items-start pb-10 w-full">
      <h2 class="font-display font-bold text-[22px] leading-[1.4] tracking-tight text-neutral-darkest">
        {{ $t('skills.sidebar.allTrainings') }}
      </h2>
      <UCheckbox
        v-for="cat in trainingCategories"
        :key="cat.slug ?? cat.label"
        :model-value="selectedCategories.includes(cat.slug ?? cat.label)"
        :label="`${cat.label}${cat.count !== undefined ? ` (${cat.count})` : ''}`"
        color="neutral"
        class="font-mono text-[13px] text-neutral-darkest"
        @update:model-value="(value) => toggleSelection(selectedCategories, cat.slug ?? cat.label, Boolean(value))"
      />
    </div>

    <div class="flex flex-col gap-6 items-start pb-10 w-full">
      <h2 class="font-display font-bold text-[22px] leading-[1.4] tracking-tight text-neutral-darkest">
        {{ $t('skills.sidebar.filterBy') }}
      </h2>
      <UCheckbox
        v-for="opt in filterOptions"
        :key="opt.label"
        :model-value="selectedFilters.includes(opt.label)"
        :label="opt.label"
        color="neutral"
        class="font-mono text-[13px] text-neutral-darkest"
        @update:model-value="(value) => toggleSelection(selectedFilters, opt.label, Boolean(value))"
      />
    </div>
  </aside>
</template>
