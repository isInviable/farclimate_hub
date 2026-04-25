<template>
  <div class="flex gap-8">
    <div :class="showIndex ? 'flex-1' : 'flex-1 max-w-4xl mx-auto'">
      <div v-if="loadError" class="mb-4 space-y-2">
        <UAlert
          color="error"
          variant="subtle"
          :title="t('recipe.loadErrorTitle')"
          :description="t('recipe.loadErrorDescription')"
        />
        <UButton size="sm" color="neutral" variant="soft" @click="loadRecipe">
          {{ t("recipe.retry") }}
        </UButton>
      </div>

      <div v-else-if="isLoading" class="space-y-4">
        <USkeleton class="h-24 w-full rounded-lg" />
        <USkeleton class="h-40 w-full rounded-lg" />
        <USkeleton class="h-32 w-full rounded-lg" />
      </div>

      <template v-else>
        <div v-if="!showIndex && visibleSections.length > 0" class="mb-6">
          <UCard>
            <template #header>
              <p class="font-bold text-xs text-muted">
                {{ t("common.tableOfContents") }}
              </p>
            </template>
            <ul class="space-y-2 text-xs px-1">
              <li v-for="section in visibleSections" :key="'toc-top-' + section.key">
                <a
                  :href="'#' + section.anchor"
                  class="flex items-center gap-2 text-muted hover:text-primary transition-colors"
                >
                  <UIcon :name="section.icon" class="size-4 shrink-0 text-primary" />
                  <span class="truncate">{{ section.title }}</span>
                </a>
              </li>
            </ul>
          </UCard>
        </div>

        <UAlert
          v-if="visibleSections.length === 0"
          color="neutral"
          variant="subtle"
          class="mb-4"
          :title="t('recipe.emptyTitle')"
          :description="t('recipe.emptyDescription')"
        />

        <template v-else>
          <div
            v-for="section in visibleSections"
            :key="section.key"
            :id="section.anchor"
            class="mb-6"
          >
            <CapturableBlock
              :title="section.title"
              pin-kind="recipe_section"
              source-view="structured"
              :payload="recipeSectionPayload(section)"
              :preview="section.content"
              :chrome="false"
            >
              <UCard class="overflow-hidden">
                <div class="p-6">
                  <div class="flex items-center gap-3 mb-4 border-b border-default pb-3 pr-10">
                    <UIcon :name="section.icon" class="size-8 shrink-0 text-primary" />
                    <h2 class="text-xl font-bold text-highlighted">
                      {{ section.title }}
                    </h2>
                  </div>
                  <div
                    class="prose prose-sm md:prose-md max-w-none text-default"
                    v-html="md.render(section.content)"
                  />
                </div>
              </UCard>
            </CapturableBlock>
          </div>
        </template>
      </template>
    </div>

    <aside v-if="showIndex" class="w-64 hidden lg:block">
      <UCard v-if="!loadError && !isLoading && visibleSections.length > 0" class="sticky top-8">
        <template #header>
          <p class="font-bold text-xs text-muted">
            {{ t("common.tableOfContents") }}
          </p>
        </template>
        <ul class="space-y-2 text-xs px-1">
          <li v-for="section in visibleSections" :key="'toc-' + section.key">
            <a
              :href="'#' + section.anchor"
              class="flex items-center gap-2 text-muted hover:text-primary transition-colors"
            >
              <UIcon :name="section.icon" class="size-4 shrink-0 text-primary" />
              <span class="truncate">{{ section.title }}</span>
            </a>
          </li>
        </ul>
      </UCard>
    </aside>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
import CapturableBlock from "./CapturableBlock.vue";

const RECIPE_SECTION_KEYS = [
  "context_summary",
  "challenges",
  "policy_context",
  "legal_aspects",
  "who_is_involved",
  "economic_data",
  "objectives",
  "solutions_implemented",
  "implementation_phases",
  "success_and_limiting",
  "benefits",
  "lessons_learnt",
  "transferability",
] as const;

type RecipeSectionKey = (typeof RECIPE_SECTION_KEYS)[number];

const SECTION_ICONS: Record<RecipeSectionKey, string> = {
  context_summary: "i-lucide-file-text",
  challenges: "i-lucide-alert-circle",
  policy_context: "i-lucide-scale",
  legal_aspects: "i-lucide-gavel",
  who_is_involved: "i-lucide-users",
  economic_data: "i-lucide-coins",
  objectives: "i-lucide-target",
  solutions_implemented: "i-lucide-lightbulb",
  implementation_phases: "i-lucide-clock",
  success_and_limiting: "i-lucide-star",
  benefits: "i-lucide-circle-dollar-sign",
  lessons_learnt: "i-lucide-book-open",
  transferability: "i-lucide-arrow-left-right",
};

interface Props {
  /** Document UUID (knowledge.documents.id) — used to load recipe when search payload omits it. */
  documentId: string;
  /** Optional cache from search `hit.document.recipe_ingredients` (skips fetch when non-empty). */
  recipeIngredients?: Record<string, string> | null;
  showIndex?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  recipeIngredients: null,
  showIndex: true,
});

const { t, locale } = useI18n();

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const resolvedIngredients = ref<Record<string, string> | null>(null);
const isLoading = ref(false);
const loadError = ref(false);

function hasRenderableRecipe(ing: unknown): boolean {
  if (!ing || typeof ing !== "object" || Array.isArray(ing)) return false;
  return Object.values(ing as Record<string, unknown>).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
}

function normalizeIngredients(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

async function loadRecipe() {
  loadError.value = false;

  if (!props.documentId) {
    resolvedIngredients.value = null;
    return;
  }

  if (hasRenderableRecipe(props.recipeIngredients)) {
    resolvedIngredients.value = normalizeIngredients(props.recipeIngredients);
    return;
  }

  isLoading.value = true;
  resolvedIngredients.value = null;

  try {
    const lang = locale.value === "es" ? "es" : "en";
    const res = await $fetch<{ recipe_ingredients: unknown }>("/api/document-recipe", {
      query: { documentId: props.documentId, lang },
    });
    resolvedIngredients.value = normalizeIngredients(res.recipe_ingredients);
  } catch (e) {
    console.error("[ArticleStructuredView] /api/document-recipe failed:", e);
    loadError.value = true;
    resolvedIngredients.value = null;
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [props.documentId, props.recipeIngredients] as const,
  () => {
    void loadRecipe();
  },
  { immediate: true },
);

const visibleSections = computed(() => {
  const ing = resolvedIngredients.value;
  if (!ing) return [];

  const list: {
    key: RecipeSectionKey;
    title: string;
    content: string;
    icon: string;
    anchor: string;
  }[] = [];

  for (const key of RECIPE_SECTION_KEYS) {
    const raw = ing[key];
    const content = typeof raw === "string" ? raw.trim() : "";
    if (!content) continue;
    list.push({
      key,
      title: t(`recipe.sections.${key}`),
      content,
      icon: SECTION_ICONS[key],
      anchor: key.replace(/_/g, "-"),
    });
  }
  return list;
});

function recipeSectionPayload(section: {
  key: RecipeSectionKey;
  title: string;
  content: string;
}) {
  return {
    sectionKey: section.key,
    sectionTitle: section.title,
    markdown: section.content,
    sourceView: "structured",
  };
}
</script>
