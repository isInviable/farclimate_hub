<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const slug = computed(() => {
  const param = route.params.slug
  return Array.isArray(param) ? param[0] : String(param)
})

const { story } = await useStoryContent(slug)

if (!story.value) {
  throw createError({ statusCode: 404, statusMessage: 'Story not found' })
}

const isKitchenSink = computed(
  () => slug.value === 'kitchen-sink' || Boolean(story.value?.showcase)
)
</script>

<template>
  <div v-if="story" class="bg-neutral-white">
    <StoryDetailHero v-bind="story.hero" />

    <StoryKitchenSinkPage
      v-if="isKitchenSink && story.showcase"
      v-bind="story.showcase"
    />

    <section
      v-else
      class="bg-neutral-lightest py-20 px-6 md:px-20"
    >
      <UContainer class="max-w-3xl px-0">
        <p class="font-mono text-base text-neutral-darkest text-center">
          {{ story.comingSoon ?? 'Content coming soon.' }}
        </p>
      </UContainer>
    </section>
  </div>
</template>
