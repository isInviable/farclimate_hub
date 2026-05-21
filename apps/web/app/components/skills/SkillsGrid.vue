<script setup lang="ts">
import type { SkillItem } from '~/types/skills'

defineProps<{
  items: SkillItem[]
}>()
</script>

<template>
  <div class="bg-neutral-lightest flex-1 px-24 py-16 self-stretch">
    <div class="grid grid-cols-2 gap-5">
      <SkillCard
        v-for="item in items"
        :key="item.id"
        :item="item"
      />
      <UAlert
        v-if="!items.length"
        class="col-span-2"
        color="neutral"
        variant="soft"
        icon="i-heroicons-information-circle"
        title="No skills found"
        description="Try clearing filters or publishing new skills from the admin panel."
      />
    </div>
  </div>
</template>
