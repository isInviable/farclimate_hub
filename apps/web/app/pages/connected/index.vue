<template>
  <div class="bg-neutral-lightest">
    <!-- hero -->
    <div class="border-b border-neutral-darkest bg-neutral-400">
      <div class="mx-auto max-w-7xl px-7 pb-11 pt-14">
        <span class="font-mono text-sm font-bold tracking-[0.2em] text-trust-blue-darkest uppercase">
          {{ $t("connected.index.eyebrow") }}
        </span>
        <h1 class="mt-4 max-w-4xl font-display text-6xl font-bold leading-[1.04] tracking-tight">
          {{ $t("connected.index.heroTitle") }}
        </h1>
        <p class="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-neutral-darker">
          {{ $t("connected.index.heroIntro") }}
        </p>

        <!-- stat strip -->
        <div class="mt-9 flex w-fit border border-neutral-darkest bg-neutral-lightest">
          <div
            v-for="(s, i) in stats"
            :key="s.key"
            class="px-7 py-4"
            :class="i ? 'border-l border-neutral-darkest' : ''"
          >
            <span class="block font-display text-4xl font-bold">{{ s.value }}</span>
            <span class="font-mono text-2xs font-semibold tracking-[0.16em] text-neutral-dark uppercase">
              {{ s.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- cards -->
    <div class="mx-auto max-w-7xl px-7 pb-20 pt-10">
      <div class="mb-4 flex items-baseline gap-3">
        <span class="font-mono text-sm font-bold tracking-[0.2em] text-neutral-dark uppercase">
          {{ $t("connected.index.cardsHeading") }}
        </span>
        <span class="h-px flex-1 bg-neutral-darkest opacity-25" />
        <CaHelp :title="$t('connected.index.helpTitle')" :w="300">
          {{ $t("connected.index.helpBody") }}
        </CaHelp>
      </div>

      <div class="grid grid-cols-1 border-l border-t border-neutral-darkest border-r md:grid-cols-2">
        <div
          v-for="card in cards"
          :key="card.id"
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
