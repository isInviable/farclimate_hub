import { computed, ref, watch, type Ref } from "vue";
import { knowledgeApiLang } from "@/utils/knowledgeApiLang";

/**
 * Canonical recipe section keys, in the fixed order required by
 * the `explorer-structured-recipe` capability. Any UI that lists or
 * iterates recipe sections SHALL respect this order.
 */
export const RECIPE_SECTION_KEYS = [
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

export type RecipeSectionKey = (typeof RECIPE_SECTION_KEYS)[number];

export const RECIPE_SECTION_ICONS: Record<RecipeSectionKey, string> = {
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

export interface RecipeSection {
  key: RecipeSectionKey;
  title: string;
  content: string;
  icon: string;
  anchor: string;
}

/**
 * Loads structured recipe ingredients for a document, using the same rules as
 * `ArticleStructuredView` (props cache → `/api/document-recipe`, fixed key
 * order, omit empty/whitespace keys). Returned `visibleSections` is the list
 * of non-empty canonical sections in canonical order, ready to drive either
 * a stacked layout or a horizontal slide deck.
 */
export function useArticleRecipe(
  documentId: Ref<string | null | undefined>,
  recipeIngredients: Ref<Record<string, string> | null | undefined>,
) {
  const { t, locale } = useI18n();

  const resolvedIngredients = ref<Record<string, string> | null>(null);
  const isLoading = ref(false);
  const loadError = ref(false);

  function hasRenderableRecipe(ing: unknown): boolean {
    if (!ing || typeof ing !== "object" || Array.isArray(ing)) return false;
    return Object.values(ing as Record<string, unknown>).some(
      (v) => typeof v === "string" && v.trim().length > 0,
    );
  }

  function normalizeIngredients(
    raw: unknown,
  ): Record<string, string> | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return Object.keys(out).length ? out : null;
  }

  async function loadRecipe(): Promise<void> {
    loadError.value = false;
    const id = documentId.value;
    if (!id) {
      resolvedIngredients.value = null;
      return;
    }

    if (hasRenderableRecipe(recipeIngredients.value)) {
      resolvedIngredients.value = normalizeIngredients(
        recipeIngredients.value,
      );
      return;
    }

    isLoading.value = true;
    resolvedIngredients.value = null;

    try {
      const lang = knowledgeApiLang(locale.value);
      const res = await $fetch<{ recipe_ingredients: unknown }>(
        "/api/document-recipe",
        { query: { documentId: id, lang } },
      );
      resolvedIngredients.value = normalizeIngredients(res.recipe_ingredients);
    } catch (e) {
      console.error("[useArticleRecipe] /api/document-recipe failed:", e);
      loadError.value = true;
      resolvedIngredients.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  watch(
    () => [documentId.value, recipeIngredients.value, locale.value] as const,
    () => {
      void loadRecipe();
    },
    { immediate: true },
  );

  const visibleSections = computed<RecipeSection[]>(() => {
    const ing = resolvedIngredients.value;
    if (!ing) return [];

    const list: RecipeSection[] = [];
    for (const key of RECIPE_SECTION_KEYS) {
      const raw = ing[key];
      const content = typeof raw === "string" ? raw.trim() : "";
      if (!content) continue;
      list.push({
        key,
        title: t(`recipe.sections.${key}`),
        content,
        icon: RECIPE_SECTION_ICONS[key],
        anchor: key.replace(/_/g, "-"),
      });
    }
    return list;
  });

  return {
    isLoading,
    loadError,
    visibleSections,
    loadRecipe,
  };
}
