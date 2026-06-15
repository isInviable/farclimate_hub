<template>
  <div class="bg-neutral-white">
    <StoriesIndexHero
      :title="$t('explorer.index.heroTitle')"
      :subtitle="$t('explorer.index.heroSubtitle')"
      background-image="/img/explorer/bg_segment.png"
      class="min-h-[300px]!"
    />

    <section class="bg-neutral-lightest py-16 px-6 md:px-20">
      <UContainer class="px-0 max-w-none">
        <div
          class="max-w-3xl mx-auto flex flex-col gap-6 text-center md:text-left"
        >
          <h2 class="font-display font-bold text-3xl text-neutral-darkest">
            {{ $t("explorer.index.aboutTitle") }}
          </h2>
          <p
            class="font-mono text-base font-light text-neutral-darkest leading-relaxed"
          >
            {{ $t("explorer.index.aboutBody") }}
          </p>
          <p class="font-mono text-sm text-neutral-dark">
            {{ $t("explorer.index.aboutHint") }}
          </p>
        </div>
        <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
          <HomeCard
            v-for="card in sectorCards"
            :key="card.sector"
            :title="card.title"
            :img-src="card.image"
            :description="card.description"
            :title-class="card.titleClass"
            :button-label="$t('explorer.index.sectorButtonLabel')"
            :to="sectorExplorerLink(card.sector)"
          />
        </div>

        <div class="mt-8 flex justify-center">
          <UFieldGroup>
            <UButton
              color="neutral"
              variant="solid"
              size="xl"
              class="bg-neutral-900 text-neutral-50 font-mono text-sm uppercase"
              :to="sectorExplorerLink('all')"
            >
              {{ $t("explorer.index.viewAll") }}
            </UButton>
            <UButton
              color="neutral"
              variant="solid"
              size="xl"
              class="bg-grounded-green-dark text-neutral-50"
              :to="sectorExplorerLink('all')"
              :aria-label="$t('explorer.index.viewAll')"
            >
              <UIcon name="material-symbols:arrow-forward" class="size-6" />
            </UButton>
          </UFieldGroup>
        </div>
        <ExplorerLandingSearchStrip v-model="landingSearch" class="mt-16" />

        <div class="mt-20 flex flex-col gap-12">
          <div class="text-center md:text-left">
            <h2 class="font-display font-bold text-3xl text-neutral-darkest">
              {{ $t("explorer.index.featuresTitle") }}
            </h2>
            <p
              class="mt-4 font-mono text-base font-light text-neutral-darkest max-w-3xl mx-auto md:mx-0"
            >
              {{ $t("explorer.index.featuresIntro") }}
            </p>
          </div>

          <div>
            <h3
              class="font-mono text-sm font-bold uppercase tracking-widest text-neutral-dark mb-6"
            >
              {{ $t("explorer.index.featuresMainHeading") }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ExplorerFeatureCard
                v-for="feature in mainFeatures"
                :key="feature.key"
                :title="feature.title"
                :description="feature.description"
                :image="feature.image"
              />
            </div>
          </div>

          <div>
            <h3
              class="font-mono text-sm font-bold uppercase tracking-widest text-neutral-dark mb-6"
            >
              {{ $t("explorer.index.featuresAiHeading") }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ExplorerFeatureCard
                v-for="feature in aiFeatures"
                :key="feature.key"
                :title="feature.title"
                :description="feature.description"
                :image="feature.image"
              />
            </div>
          </div>
        </div>
        <div class="mt-8 flex justify-center">
          <UButton
            color="primary"
            variant="solid"
            size="xl"
            class=""
            :to="sectorExplorerLink('all')"
          >
            {{ $t("explorer.index.gotoexplorer") }}
          </UButton>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { localizedSectorSearchTerm } from "~/utils/explorerSectorSearch";

const { t } = useI18n();
const localePath = useLocalePath();
const landingSearch = ref("");

definePageMeta({
  layout: "default",
});

const mainFeatures = computed(() => [
  {
    key: "explore",
    title: t("explorer.index.features.explore.title"),
    description: t("explorer.index.features.explore.description"),
    image: "/img/home/explorer.jpg",
  },
  {
    key: "compare",
    title: t("explorer.index.features.compare.title"),
    description: t("explorer.index.features.compare.description"),
    image: "/img/home/compare.jpg",
  },

  {
    key: "curate",
    title: t("explorer.index.features.curate.title"),
    description: t("explorer.index.features.curate.description"),
    image: "/img/home/mindmap.jpg",
  },
]);

const aiFeatures = computed(() => [
  {
    key: "board",
    title: t("explorer.index.features.board.title"),
    description: t("explorer.index.features.board.description"),
    image: "/img/home/board.jpg",
  },

  {
    key: "generate",
    title: t("explorer.index.features.generate.title"),
    description: t("explorer.index.features.generate.description"),
    image: "/img/home/presentacion.jpg",
  },
  {
    key: "share",
    title: t("explorer.index.features.share.title"),
    description: t("explorer.index.features.share.description"),
    image: "/img/home/grouped.jpg",
  },
]);

const sectorCards = computed(() => [
  {
    sector: "forestry",
    title: t("explorer.index.sectorForestry"),
    description: t("explorer.index.sectorForestryDescription"),
    image: "/img/forestry@2x.png",
    titleClass: "text-community-pink-darkest",
  },
  {
    sector: "fishery",
    title: t("explorer.index.sectorFishery"),
    description: t("explorer.index.sectorFisheryDescription"),
    image: "/img/fisheries@2x.png",
    titleClass: "text-trust-blue-darkest",
  },
  {
    sector: "agriculture",
    title: t("explorer.index.sectorAgriculture"),
    description: t("explorer.index.sectorAgricultureDescription"),
    image: "/img/agriculture@2x.png",
    titleClass: "text-grounded-green-dark",
  },
]);

function sectorExplorerLink(sectorKey: string) {
  return localePath({
    path: "/explorer/explorer",
    query: { sector: localizedSectorSearchTerm(sectorKey, t) },
  });
}

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
