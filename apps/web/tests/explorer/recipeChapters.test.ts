import { describe, expect, it } from "vitest";
import { RECIPE_SECTION_KEYS } from "../../app/composables/useArticleRecipe";
import {
  buildRecipeChapters,
  type RecipeChapterId,
  type RecipeNavSegment,
} from "../../app/composables/recipeChapters";

const CHAPTER_LABELS: Record<RecipeChapterId, string> = {
  introduction: "Introducción",
  startingPoint: "Situación de partida",
  howItWasDone: "Cómo se hizo",
  whatWasAchieved: "Qué se logró",
};

const SECTION_LABELS: Record<string, string> = {
  context_summary: "Breve contexto",
  policy_context: "Políticas públicas",
  legal_aspects: "Aspectos legales",
  challenges: "Retos",
  objectives: "Objetivos",
  who_is_involved: "Quién participa",
  implementation_phases: "Fases de implementación",
  economic_data: "Datos económicos",
  solutions_implemented: "Soluciones implementadas",
  benefits: "Beneficios",
  lessons_learnt: "Lecciones aprendidas",
  success_and_limiting: "Factores de éxito y limitantes",
  transferability: "Transferibilidad",
};

function segmentsFor(keys: readonly string[]): RecipeNavSegment[] {
  return [
    { id: "summary-plus", label: "Resumen" },
    { id: "map", label: "Ubicación" },
    ...keys.map((id) => ({ id, label: SECTION_LABELS[id] ?? id })),
  ];
}

describe("buildRecipeChapters", () => {
  it("groups a full recipe in chapter order with sea-glass images", () => {
    const chapters = buildRecipeChapters(
      segmentsFor(RECIPE_SECTION_KEYS),
      CHAPTER_LABELS,
    );

    expect(chapters.map((chapter) => chapter.id)).toEqual([
      "introduction",
      "startingPoint",
      "howItWasDone",
      "whatWasAchieved",
    ]);
    expect(chapters[0]?.label).toBe("Introducción");
    expect(chapters[0]?.items.map((item) => item.label)).toEqual([
      "Resumen",
      "Ubicación",
    ]);
    expect(chapters[0]?.items.map((item) => item.index)).toEqual([0, 1]);
    expect(chapters[1]?.label).toBe("1. Situación de partida");
    expect(chapters[1]?.items.map((item) => item.id)).toEqual([
      "context_summary",
      "policy_context",
      "legal_aspects",
      "challenges",
    ]);
    expect(
      chapters
        .flatMap((chapter) => chapter.items)
        .find((item) => item.id === "policy_context")?.image,
    ).toBe("/img/adaptarium/receta/12-icono-politicas-politicas.png");
    expect(chapters.flatMap((chapter) => chapter.items).at(-1)).toMatchObject({
      id: "transferability",
      index: 14,
    });
  });

  it("omits an empty chapter and keeps Ubicación second", () => {
    const chapters = buildRecipeChapters(
      segmentsFor(["context_summary", "benefits"]),
      CHAPTER_LABELS,
    );

    expect(chapters.map((chapter) => chapter.id)).toEqual([
      "introduction",
      "startingPoint",
      "whatWasAchieved",
    ]);
    expect(chapters[0]?.items.map((item) => item.id)).toEqual([
      "summary-plus",
      "map",
    ]);
    expect(chapters[0]?.items[1]).toMatchObject({
      label: "Ubicación",
      index: 1,
    });
    expect(chapters[1]?.items.map((item) => item.id)).toEqual([
      "context_summary",
    ]);
    expect(chapters[2]?.items.map((item) => item.id)).toEqual(["benefits"]);
    expect(chapters[2]?.items[0]?.index).toBe(3);
  });
});
