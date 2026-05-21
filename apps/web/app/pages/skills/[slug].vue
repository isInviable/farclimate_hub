<script setup lang="ts">
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const localePath = useLocalePath();
const { fetchPublishedSkillBySlug } = useSkillsContent();

const slug = computed(() => {
  const param = route.params.slug;
  return Array.isArray(param) ? param[0] : String(param);
});

const { data: skill } = await useAsyncData(
  () => `published-skill-${slug.value}`,
  () => fetchPublishedSkillBySlug(slug.value),
  {
    watch: [slug],
  },
);

if (!skill.value) {
  throw createError({ statusCode: 404, statusMessage: "Skill not found" });
}
</script>

<template>
  <div v-if="skill" class="bg-neutral-lightest">
    <section class="relative min-h-[420px] flex items-end overflow-hidden">
      <img
        :src="skill.image"
        :alt="skill.title"
        class="absolute inset-0 size-full object-cover"
      />
      <div class="absolute inset-0 bg-linear-to-b from-black/10 to-neutral-darkest/90" />

      <UContainer class="relative max-w-5xl py-16">
        <div class="flex flex-wrap gap-2 mb-6">
          <UBadge
            v-for="tag in skill.tags"
            :key="tag.slug"
            color="neutral"
            variant="soft"
          >
            {{ tag.label }}
          </UBadge>
        </div>

        <h1 class="font-display font-bold text-[52px] leading-[1.15] tracking-tight text-neutral-lightest max-w-4xl">
          {{ skill.title }}
        </h1>
        <p class="mt-6 font-mono text-base leading-relaxed text-white max-w-3xl">
          {{ skill.description }}
        </p>
      </UContainer>
    </section>

    <section class="px-6 py-16 md:px-20">
      <UContainer class="max-w-4xl px-0">
        <div class="mb-8">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            :to="localePath('/skills')"
          >
            Back to skills
          </UButton>
        </div>

        <UCard>
          <MdPreview
            :model-value="skill.bodyMarkdown"
            :editor-id="`skill-preview-${skill.id}`"
            language="en-US"
          />
        </UCard>

        <UCard v-if="skill.links.length" class="mt-8">
          <template #header>
            <h2 class="font-display text-2xl font-bold text-neutral-darkest">
              External links
            </h2>
          </template>

          <ul class="space-y-3">
            <li
              v-for="link in skill.links"
              :key="`${link.url}-${link.sort_order}`"
            >
              <UButton
                :to="link.url"
                target="_blank"
                rel="noopener noreferrer"
                trailing-icon="i-heroicons-arrow-top-right-on-square"
                variant="link"
                class="px-0"
              >
                {{ link.label }}
              </UButton>
            </li>
          </ul>
        </UCard>
      </UContainer>
    </section>
  </div>
</template>
