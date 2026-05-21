<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { fetchPublishedSkills, buildTagFilters } = useSkillsContent()
const { locale } = useI18n()
const selectedTagSlugs = ref<string[]>([])

const { data: skillsData } = await useAsyncData('published-skills', () => fetchPublishedSkills(), {
  watch: [locale],
})

const skills = computed(() => skillsData.value ?? [])
const trainingCategories = computed(() => buildTagFilters(skills.value))
const filteredSkills = computed(() => {
  if (!selectedTagSlugs.value.length) return skills.value

  return skills.value.filter((skill) =>
    selectedTagSlugs.value.every((slug) => skill.tags.some((tag) => tag.slug === slug)),
  )
})

const filterOptions = [
  { label: 'More views' },
  { label: 'Relevance' },
]
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
        v-model:selected-categories="selectedTagSlugs"
        :training-categories="trainingCategories"
        :filter-options="filterOptions"
      />
      <SkillsGrid :items="filteredSkills" />
    </div>
  </div>
</template>
