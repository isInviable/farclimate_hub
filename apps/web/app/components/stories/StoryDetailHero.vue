<script setup lang="ts">
type StoryHeroAuthor = {
  name: string
  organization: string
  avatar: string
}

const props = defineProps<{
  backLabel: string
  tags: string[]
  title: string
  subtitle: string
  backgroundImage: string
  date: string
  readTime: string
  author: StoryHeroAuthor
}>()

const localePath = useLocalePath()
const backTo = computed(() => localePath('/stories'))
</script>

<template>
  <section class="relative min-h-[520px] flex flex-col overflow-hidden">
    <img
      :src="backgroundImage"
      alt=""
      class="absolute inset-0 w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-black/20" />

    <div class="relative flex-1 flex flex-col">
      <div class="px-6 md:px-20 pt-8">
        <UFieldGroup>
          <UButton
            color="neutral"
            variant="solid"
            class="bg-neutral-darkest text-neutral-lightest"
            :to="backTo"
            :aria-label="backLabel"
          >
            <UIcon name="material-symbols:arrow-back" class="size-6" />
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            class="bg-neutral-lightest text-neutral-darkest font-mono text-sm"
            :to="backTo"
          >
            {{ backLabel }}
          </UButton>
        </UFieldGroup>
      </div>

      <div class="flex-1 flex flex-col justify-end px-6 md:px-20 pb-16 pt-12">
        <div class="bg-neutral-darkest/40 px-6 md:px-20 py-12 md:py-16 flex flex-col gap-5 max-w-5xl">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in tags"
              :key="tag"
              class="rounded-full border border-neutral-lightest px-4 py-1 font-mono text-xs text-neutral-lightest"
            >
              {{ tag }}
            </span>
          </div>
          <h1 class="typo-h1 text-neutral-lightest">
            {{ title }}
          </h1>
          <p class="font-display font-bold text-3xl text-neutral-lightest">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div
        class="relative bg-linear-to-t from-neutral-darkest from-30% to-transparent px-6 md:px-20 py-8"
      >
        <div class="flex flex-wrap items-center gap-6 font-mono text-sm text-neutral-lightest">
          <span class="inline-flex items-center gap-2">
            <UIcon name="material-symbols:date-range" class="size-4" />
            {{ date }}
          </span>
          <span class="inline-flex items-center gap-2">
            <UIcon name="material-symbols:timer" class="size-4" />
            {{ readTime }}
          </span>
          <StoryAuthorRow
            :name="author.name"
            :organization="author.organization"
            :avatar="author.avatar"
            variant="on-dark"
          />
        </div>
      </div>
    </div>
  </section>
</template>
