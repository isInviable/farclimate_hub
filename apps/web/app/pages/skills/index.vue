<script setup lang="ts">
definePageMeta({
  layout: 'site',
})

const { fetchPublishedSkills } = useSkillsContent()
const { locale, t } = useI18n()

const { data: skillsData } = await useAsyncData('published-skills', () => fetchPublishedSkills(), {
  watch: [locale],
})

const skills = computed(() => skillsData.value ?? [])

useSeoMeta({
  title: () => t('skills.index.title'),
  description: () => t('skills.index.lede'),
})
</script>

<template>
  <div>
    <SkillsHero />
    <SkillsGrid :items="skills" />
  </div>
</template>
