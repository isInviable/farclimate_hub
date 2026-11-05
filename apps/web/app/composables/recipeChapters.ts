export const RECIPE_CHAPTER_IDS = [
  "introduction",
  "startingPoint",
  "howItWasDone",
  "whatWasAchieved",
] as const;

export type RecipeChapterId = (typeof RECIPE_CHAPTER_IDS)[number];

export interface RecipeNavSegment {
  id: string;
  label: string;
}

export interface RecipeChapterItem {
  id: string;
  label: string;
  image: string;
  index: number;
}

export interface RecipeChapter {
  id: RecipeChapterId;
  label: string;
  items: RecipeChapterItem[];
}

const RECIPE_IMAGE_BASE = "/img/adaptarium/receta";

export const RECIPE_SEGMENT_IMAGES: Record<string, string> = {
  "summary-plus": `${RECIPE_IMAGE_BASE}/13-icono-resumen.png`,
  map: `${RECIPE_IMAGE_BASE}/03-icono-ubicacion.png`,
  context_summary: `${RECIPE_IMAGE_BASE}/14-icono-breve-contexto.png`,
  policy_context: `${RECIPE_IMAGE_BASE}/12-icono-politicas-politicas.png`,
  legal_aspects: `${RECIPE_IMAGE_BASE}/15-icono-aspectos-legales.png`,
  challenges: `${RECIPE_IMAGE_BASE}/08-icono-retos.png`,
  objectives: `${RECIPE_IMAGE_BASE}/02-icono-objetivos.png`,
  who_is_involved: `${RECIPE_IMAGE_BASE}/07-icono-quien-participa.png`,
  implementation_phases: `${RECIPE_IMAGE_BASE}/10-icono-fases-de-implementacion.png`,
  economic_data: `${RECIPE_IMAGE_BASE}/05-icono-datos-economicos.png`,
  solutions_implemented: `${RECIPE_IMAGE_BASE}/16-icono-soluciones-implementadas.png`,
  benefits: `${RECIPE_IMAGE_BASE}/11-icono-beneficios.png`,
  lessons_learnt: `${RECIPE_IMAGE_BASE}/09-icono-lecciones-aprendidas.png`,
  success_and_limiting: `${RECIPE_IMAGE_BASE}/04-icono-factores-de-exito-y-limitantes.png`,
  transferability: `${RECIPE_IMAGE_BASE}/06-icono-transferibilidad.png`,
};

const CHAPTER_SEGMENT_IDS: Record<RecipeChapterId, readonly string[]> = {
  introduction: ["summary-plus", "map"],
  startingPoint: [
    "context_summary",
    "policy_context",
    "legal_aspects",
    "challenges",
  ],
  howItWasDone: [
    "objectives",
    "who_is_involved",
    "implementation_phases",
    "economic_data",
  ],
  whatWasAchieved: [
    "solutions_implemented",
    "benefits",
    "lessons_learnt",
    "success_and_limiting",
    "transferability",
  ],
};

const CHAPTER_NUMBERS: Partial<Record<RecipeChapterId, number>> = {
  startingPoint: 1,
  howItWasDone: 2,
  whatWasAchieved: 3,
};

export function buildRecipeChapters(
  segments: readonly RecipeNavSegment[],
  chapterLabels: Record<RecipeChapterId, string>,
): RecipeChapter[] {
  const indexById = new Map<string, number>();
  segments.forEach((segment, index) => {
    if (!indexById.has(segment.id)) indexById.set(segment.id, index);
  });
  const segmentById = new Map(segments.map((segment) => [segment.id, segment]));

  const chapters: RecipeChapter[] = [];
  for (const id of RECIPE_CHAPTER_IDS) {
    const items: RecipeChapterItem[] = [];
    for (const segmentId of CHAPTER_SEGMENT_IDS[id]) {
      const segment = segmentById.get(segmentId);
      const index = indexById.get(segmentId);
      const image = RECIPE_SEGMENT_IMAGES[segmentId];
      if (!segment || index === undefined || !image) continue;
      items.push({
        id: segment.id,
        label: segment.label,
        image,
        index,
      });
    }
    if (items.length === 0) continue;
    const number = CHAPTER_NUMBERS[id];
    chapters.push({
      id,
      label: number ? `${number}. ${chapterLabels[id]}` : chapterLabels[id],
      items,
    });
  }
  return chapters;
}
