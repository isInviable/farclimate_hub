<script setup lang="ts">
definePageMeta({
  layout: 'stories',
})

const route = useRoute()
const slug = computed(() => {
  const param = route.params.slug
  const value = Array.isArray(param) ? param[0] : param
  return value ?? ''
})

const { story } = await useStoryContent(slug)
const { article } = await useStoryArticleContent()

if (!story.value) {
  throw createError({ statusCode: 404, statusMessage: 'Story not found' })
}
</script>

<template>
  <StoryArticle
    v-if="story && article"
    :hero="article.hero"
    :identity="article.identity"
    :lead="article.lead"
    :banner="article.banner"
    :chapters="article.chapters"
  />
</template>
