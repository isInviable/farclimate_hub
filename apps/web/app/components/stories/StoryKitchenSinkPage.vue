<script setup lang="ts">
type ShowcaseSection = {
  id: string
  number: string
  title: string
  overview?: Record<string, unknown>
  gallery?: Record<string, unknown>
  stats?: Record<string, unknown>
  dataTable?: Record<string, unknown>
  quote?: Record<string, unknown>
  linkList?: Record<string, unknown>
  team?: Record<string, unknown>
  donuts?: Record<string, unknown>
  timeline?: Record<string, unknown>
}

defineProps<{
  metaBar: {
    shareLabel: string
    items: Array<{ icon: string, label: string }>
  }
  sections: ShowcaseSection[]
}>()
</script>

<template>
  <div class="flex flex-col">
    <StoryMetaBar v-bind="metaBar" />

    <div class="flex flex-col gap-16 py-16 px-6 md:px-20 bg-neutral-lightest">
      <section
        v-for="section in sections"
        :key="section.id"
        class="flex flex-col gap-8"
      >
        <StorySectionHeading :number="section.number" :title="section.title" />

        <StoryOverviewGrid
          v-if="section.overview"
          v-bind="(section.overview as any)"
        />
        <StoryImageGallery
          v-else-if="section.gallery"
          v-bind="(section.gallery as any)"
        />
        <StoryStatGrid
          v-else-if="section.stats"
          v-bind="(section.stats as any)"
        />
        <StoryDataTable
          v-else-if="section.dataTable"
          v-bind="(section.dataTable as any)"
        />
        <StoryQuoteSection
          v-else-if="section.quote"
          v-bind="(section.quote as any)"
        />
        <StoryLinkList
          v-else-if="section.linkList"
          v-bind="(section.linkList as any)"
        />
        <StoryTeamSection
          v-else-if="section.team"
          v-bind="(section.team as any)"
        />
        <StoryDonutPair
          v-else-if="section.donuts"
          v-bind="(section.donuts as any)"
        />
        <StoryTimelineStrip
          v-else-if="section.timeline"
          v-bind="(section.timeline as any)"
        />
      </section>
    </div>
  </div>
</template>
