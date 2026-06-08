<template>
  <div class="bg-neutral-lightest">
    <!-- hero -->
    <div class="border-b border-neutral-darkest bg-warm-neutral-100">
      <div class="mx-auto max-w-[1320px] px-7 pb-11 pt-14">
        <span class="font-mono text-[11px] font-bold tracking-[0.2em] text-trust-blue-darkest">
          CONNECTED ACTION
        </span>
        <h1 class="mt-4 max-w-[900px] font-display text-6xl font-bold leading-[1.04] tracking-tight">
          Explore the European climate-adaptation network
        </h1>
        <p class="mt-4 max-w-[680px] font-sans text-lg leading-relaxed text-neutral-darker">
          A data section for browsing European-funded climate-adaptation projects and the
          organisations behind them. Four lenses — each answers a different question about how
          the work connects across topics, places and partners.
        </p>

        <!-- stat strip -->
        <div class="mt-9 flex w-fit border border-neutral-darkest bg-neutral-lightest">
          <div
            v-for="(s, i) in stats"
            :key="s.label"
            class="px-7 py-4"
            :class="i ? 'border-l border-neutral-darkest' : ''"
          >
            <span class="block font-display text-4xl font-bold">{{ s.value }}</span>
            <span class="font-mono text-2xs font-semibold tracking-[0.16em] text-neutral-dark">
              {{ s.label.toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- cards -->
    <div class="mx-auto max-w-[1320px] px-7 pb-20 pt-10">
      <div class="mb-4 flex items-baseline gap-3">
        <span class="font-mono text-[11px] font-bold tracking-[0.2em] text-neutral-dark">
          FOUR WAYS TO EXPLORE
        </span>
        <span class="h-px flex-1 bg-neutral-darkest opacity-25" />
        <CaHelp title="How to use this" :w="300">
          Each card opens a live visualization. Use the tab bar at the top to switch between them
          at any time; every view has its own short explainer and help tips.
        </CaHelp>
      </div>

      <div class="grid grid-cols-1 border-l border-t border-neutral-darkest md:grid-cols-2">
        <div
          v-for="card in cards"
          :key="card.id"
          class="border-b border-r border-neutral-darkest"
        >
          <CaExploreCard
            :id="card.id"
            :n="card.n"
            :glyph="card.glyph"
            :accent="card.accent"
            :title="card.title"
            :lede="card.lede"
            :body="card.body"
            :shows="card.shows"
            :to="card.to"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CA_CAT } from "~/utils/connectedColors";

definePageMeta({ layout: "connected" });

const supabase = useSupabaseClient();

const { data: totals } = await useAsyncData("connected-overview-totals", async () => {
  const [projects, entities, themes, countryRows] = await Promise.all([
    supabase.from("projects_cordis").select("id", { count: "exact", head: true }),
    supabase.from("entities_cordis").select("id", { count: "exact", head: true }),
    supabase.from("aux_themes").select("id", { count: "exact", head: true }),
    supabase.from("entities_cordis").select("address_country"),
  ]);

  const countries = new Set(
    (countryRows.data ?? [])
      .map((r: any) => r.address_country)
      .filter((c: string | null) => !!c),
  ).size;

  return {
    projects: projects.count ?? 0,
    entities: entities.count ?? 0,
    themes: themes.count ?? 0,
    countries,
  };
});

const stats = computed(() => [
  { value: totals.value?.projects ?? 0, label: "projects" },
  { value: totals.value?.entities ?? 0, label: "entities" },
  { value: totals.value?.countries ?? 0, label: "countries" },
  { value: totals.value?.themes ?? 0, label: "themes" },
]);

const cards = [
  {
    id: "dashboard",
    n: "01",
    glyph: "▦",
    accent: CA_CAT.blue,
    title: "Dashboard",
    lede: "The whole network at a glance.",
    body: "Headline counts plus where the work concentrates — entities per country and projects by adaptation topic.",
    shows: ["Project & entity totals", "Entities per country", "Projects by topic"],
    to: "/connected/dashboard",
  },
  {
    id: "map",
    n: "02",
    glyph: "◉",
    accent: CA_CAT.moss,
    title: "Entities Map",
    lede: "Where the participants are.",
    body: "Every participating organisation placed on a map of Europe, filterable by climate risk, theme and project.",
    shows: ["Geo-located entities", "Filter by risk / theme", "NUTS3 region detail"],
    to: "/connected/EntitiesMap",
  },
  {
    id: "network",
    n: "03",
    glyph: "⌗",
    accent: CA_CAT.rust,
    title: "Project–Entity Connections",
    lede: "Who works with whom.",
    body: "A network linking each project to the entities that took part — projects ordered by start year, entities grouped by country.",
    shows: ["Projects ↔ entities", "Ordered by year", "Shared-partner links"],
    to: "/connected/PrjEntConnected",
  },
  {
    id: "umap",
    n: "04",
    glyph: "✸",
    accent: CA_CAT.ochre,
    title: "Projects UMAP",
    lede: "How projects relate by topic.",
    body: "Projects positioned in 2-D semantic space — those sitting close together tackle similar adaptation themes.",
    shows: ["Semantic 2-D layout", "Thematic clusters", "Size = entities involved"],
    to: "/connected/ProjectsUmapNew",
  },
];
</script>
