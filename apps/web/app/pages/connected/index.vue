<template>
  <div>
    <section class="relative flex min-h-48 items-center overflow-hidden bg-adapt-connected-hero lg:min-h-[46rem]">
      <img
        src="/img/adaptarium/connected-action.jpg"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full object-contain object-center"
      >
      <div class="relative z-10 grid w-full lg:grid-cols-2">
        <div class="hidden lg:block" />
        <div class="px-6 py-6 lg:px-10">
          <p class="font-adapt-heavy text-[1.5625rem] leading-[0.9] tracking-[1px] text-white lg:text-[2.875rem]">
            <span v-for="line in lockup" :key="line" class="block">{{ line }}</span>
          </p>
          <p class="font-adapt-title text-[1.75rem] leading-none text-white lg:text-[2.625rem]">
            ACTION
          </p>
        </div>
      </div>
    </section>

    <section class="bg-adapt-connected-mint px-6 py-10 text-black lg:px-10 lg:py-16">
      <div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3 lg:items-start">
        <div class="text-right">
          <p class="font-adapt-keyword text-[1.6875rem] leading-none tracking-[2px] uppercase">
            <span v-for="line in kickerLines" :key="line" class="block">{{ line }}</span>
          </p>
          <h1 class="mt-2 font-adapt-heavy text-[1.75rem] leading-[1.1] tracking-[1px] text-white lg:text-[2.625rem]">
            <span v-for="line in titleLines" :key="line" class="block">{{ line }}</span>
          </h1>
        </div>
        <div>
          <p class="font-adapt-body text-base leading-snug">
            {{ t("connected.index.heroIntro") }}
          </p>
          <img
            src="/img/adaptarium/gemas-connected.png"
            alt="Two pieces of sea glass"
            class="mt-6 w-full max-w-sm"
          >
        </div>
        <div>
          <div v-for="stat in stats" :key="stat.key">
            <p class="font-adapt-heavy text-[2.625rem] leading-none tracking-[1px] text-adapt-connected-figure">
              {{ stat.value }}
            </p>
            <p class="mb-2 font-adapt-keyword text-[1.6875rem] leading-none tracking-[2px] text-white uppercase">
              {{ stat.label }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-adapt-connected-paper px-6 py-10 lg:px-10 lg:pb-20 lg:pt-12">
      <div class="mx-auto max-w-7xl">
        <div class="mb-8 flex items-end gap-4 lg:grid lg:grid-cols-4 lg:items-center">
          <p class="font-adapt-heavy text-[5.1875rem] leading-none tracking-[1px] text-adapt-connected-figure lg:text-right">
            {{ cards.length }}
          </p>
          <p class="font-adapt-keyword text-[1.6875rem] leading-none tracking-[2px] text-black uppercase lg:col-span-3">
            <span v-for="line in waysLines" :key="line" class="block">{{ line }}</span>
          </p>
        </div>

        <div class="grid grid-cols-1 border-t border-r border-l border-neutral-darkest md:grid-cols-2">
          <div v-for="card in cards" :key="card.id">
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { CA_CAT } from "~/utils/connectedColors";

definePageMeta({ layout: "site" });

const lockup = ["CO", "NNEC", "TED"] as const;

const { t, tm, rt } = useI18n();
const localePath = useLocalePath();
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
      .map((r: { address_country: string | null }) => r.address_country)
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
  { key: "projects", value: totals.value?.projects ?? 0, label: t("connected.index.stats.projects") },
  { key: "entities", value: totals.value?.entities ?? 0, label: t("connected.index.stats.entities") },
  { key: "countries", value: totals.value?.countries ?? 0, label: t("connected.index.stats.countries") },
  { key: "themes", value: totals.value?.themes ?? 0, label: t("connected.index.stats.themes") },
]);

const cardDefs = [
  {
    id: "dashboard",
    key: "dashboard",
    n: "01",
    glyph: "▦",
    accent: CA_CAT.blue,
    to: "/connected/dashboard",
  },
  {
    id: "map",
    key: "map",
    n: "02",
    glyph: "◉",
    accent: CA_CAT.moss,
    to: "/connected/EntitiesMap",
  },
  {
    id: "network",
    key: "network",
    n: "03",
    glyph: "⌗",
    accent: CA_CAT.rust,
    to: "/connected/PrjEntConnected",
  },
  {
    id: "umap",
    key: "umap",
    n: "04",
    glyph: "✸",
    accent: CA_CAT.ochre,
    to: "/connected/ProjectsUmapNew",
  },
] as const;

function resolveMessageList(key: string): string[] {
  const raw = tm(key);
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => (typeof item === "string" ? item : String(rt(item))));
}

const kickerLines = computed(() => resolveMessageList("connected.index.kicker"));
const titleLines = computed(() => resolveMessageList("connected.index.title"));
const waysLines = computed(() => resolveMessageList("connected.index.ways"));

const cards = computed(() =>
  cardDefs.map((card) => ({
    id: card.id,
    n: card.n,
    glyph: card.glyph,
    accent: card.accent,
    title: t(`connected.index.cards.${card.key}.title`),
    lede: t(`connected.index.cards.${card.key}.lede`),
    body: t(`connected.index.cards.${card.key}.body`),
    shows: resolveMessageList(`connected.index.cards.${card.key}.shows`),
    to: localePath(card.to),
  })),
);

useHead({
  title: () => t("connected.index.metaTitle"),
  meta: [
    {
      name: "description",
      content: () => t("connected.index.metaDescription"),
    },
  ],
});
</script>
