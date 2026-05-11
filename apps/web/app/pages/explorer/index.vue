<template>
  <div class="min-h-screen bg-neutral-lightest">
    <DeliverableHeader />

    <div class="p-4 md:p-6">
      <div class="max-w-4xl mx-auto">
        <ExplorerLandingIntro />

        <ExplorerLandingSectorGrid />

        <ExplorerLandingSearchStrip v-model="landingSearch" />

        <p class="mt-10 md:mt-12 text-center typo-body text-sm text-neutral-dark">
          {{ $t("explorer.index.footerHint") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const landingSearch = ref("");

definePageMeta({
  layout: false,
});

useHead({
  title: () => t("explorer.index.metaTitle"),
  meta: [
    {
      name: "description",
      content: () => t("explorer.index.metaDescription"),
    },
  ],
});
</script>
