<script setup lang="ts">
type StoryCardAuthor = {
  name: string
  organization: string
  avatar: string
}

const props = defineProps<{
  slug: string
  tag: string
  title: string
  date: string
  readTime: string
  author: StoryCardAuthor
  excerpt: string
  image: string
  readLabel: string
}>()

const localePath = useLocalePath()
const storyTo = computed(() => localePath(`/stories/${props.slug}`))
</script>

<template>
  <article class="bg-white border border-neutral p-6">
    <div class="flex flex-col md:flex-row gap-6">
      <div class="flex-1 min-h-48 md:min-h-0 relative overflow-hidden">
        <img
          :src="image"
          alt=""
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div
          class="absolute inset-0 bg-linear-to-b from-transparent from-0% to-neutral-darkest to-73%"
        />
      </div>

      <div class="flex-1 flex flex-col gap-6 items-start md:items-end">
        <div class="w-full flex flex-col gap-6 items-start">
          <StoryTag :label="tag" />

          <h2 class="font-display font-bold text-3xl text-neutral-darkest w-full">
            {{ title }}
          </h2>

          <div class="flex flex-wrap items-center gap-4 font-mono text-sm text-neutral-darkest">
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="material-symbols:date-range" class="size-4" />
              {{ date }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="material-symbols:timer" class="size-4" />
              {{ readTime }}
            </span>
          </div>

          <StoryAuthorRow
            :name="author.name"
            :organization="author.organization"
            :avatar="author.avatar"
          />

          <p class="font-mono font-light text-sm text-neutral-darkest w-full">
            {{ excerpt }}
          </p>
        </div>

        <StoryReadButton :label="readLabel" :to="storyTo" />
      </div>
    </div>
  </article>
</template>
