<script setup lang="ts">
import type { SkillItem } from '~/types/skills'

defineProps<{
  items: SkillItem[]
}>()

function stoneSrc(index: number) {
  return `/img/adaptarium/piedras_saber_mas/boton-saber-mas-${(index % 7) + 1}.png`
}
</script>

<template>
  <div class="bg-adapt-skills-sea">
    <div
      v-if="items.length"
      class="grid lg:grid-cols-3"
    >
      <SkillCard
        v-for="(item, index) in items"
        :key="item.id"
        :item="item"
        :stone-src="stoneSrc(index)"
        :class="[
          index >= 3 ? 'lg:border-t-2 lg:border-t-adapt-skills-rule' : '',
          index % 3 === 1 ? 'lg:border-x-2 lg:border-x-adapt-aqua' : '',
        ]"
      />
    </div>
    <UAlert
      v-else
      class="m-8"
      color="neutral"
      variant="soft"
      icon="i-heroicons-information-circle"
      :title="$t('skills.empty.title')"
      :description="$t('skills.empty.description')"
    />
  </div>
</template>
