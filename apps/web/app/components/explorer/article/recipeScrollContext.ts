import type { InjectionKey, Ref } from "vue";

export const RecipeScrollRootKey: InjectionKey<Ref<HTMLElement | null>> =
  Symbol("recipeScrollRoot");
