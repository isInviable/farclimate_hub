<script setup lang="ts">
import type { SkillItem } from '~/composables/useSkillsData'

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
    </div>
  </div>
</template>
