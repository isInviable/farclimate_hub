import type { InjectionKey, Ref } from "vue";

export const RecipeScrollRootKey: InjectionKey<
  Readonly<Ref<HTMLElement | Window | null>>
> = Symbol("recipeScrollRoot");
