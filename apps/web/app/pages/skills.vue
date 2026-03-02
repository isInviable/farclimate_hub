<script setup lang="ts">
const { skills, trainingCategories, filterOptions } = useSkillsData()

definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div class="bg-neutral-white">
    <SkillsHero
      title="Learn the skills to adapt and thrive in a changing climate"
      subtitle="Here you can explore practical skills to face climate challenges. Filter what interests you from the menu on the left, and discover on the right a collection of tools, courses, and real cases ready to inspire your next steps"
      background-image="/img/skills/23abb7e57f65a6f389a430319f19e1f5ac16771d.png"
    />

    <div class="flex items-stretch">
      <SkillsFilterSidebar
        :training-categories="trainingCategories"
        :filter-options="filterOptions"
      />
      <SkillsGrid :items="skills" />
    </div>
  </div>
</template>
