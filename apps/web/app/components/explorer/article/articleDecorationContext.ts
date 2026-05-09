import type { InjectionKey, Ref } from "vue";

export type ArticleDecorationCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "middle-left"
  | "middle-right"
  | "bottom-right";

export interface ArticleDecoration {
  src: string;
  corner?: ArticleDecorationCorner;
  sizeClass?: string;
}

export interface ArticleDecorationContext {
  decoration: Ref<ArticleDecoration | null>;
  setDecoration: (source: symbol, decoration: ArticleDecoration) => void;
  clearDecoration: (source: symbol) => void;
}

export const ArticleDecorationContextKey: InjectionKey<ArticleDecorationContext> =
  Symbol("ArticleDecorationContext");
