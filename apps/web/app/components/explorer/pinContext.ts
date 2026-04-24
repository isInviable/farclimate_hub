import type { InjectionKey, Ref } from "vue";

/**
 * Context provided by an article-hosting view (e.g. `ArticleViewAI`) so that
 * nested pin entry points (`SelectableBlock`) can stamp newly-created pins with
 * the parent document's `source_document_uid` and `source_title_snapshot`.
 *
 * Views that are not rendering a known knowledge document should not provide
 * this context; in that case consumers default to the degraded "source missing"
 * behaviour.
 */
export interface PinArticleContext {
  /** Stable UID of the parent document (`document_uid`), falling back to the
   * document's internal UUID when only that is available. `null` when unknown. */
  documentUid: Ref<string | null>;
  /** Human-readable title of the parent document. `null` when unknown. */
  title: Ref<string | null>;
  /**
   * Parent document's geographic coordinates as `[latitude, longitude]`, or
   * `null` when the document has no valid location. Used by `SelectableBlock`
   * (and siblings) to stamp `body.data.location` at pin-creation time so the
   * pinboard map view (see change `pinboard-global-map`) can render a marker
   * per article without refetching documents.
   */
  location: Ref<[number, number] | null>;
}

export const PinArticleContextKey: InjectionKey<PinArticleContext> = Symbol(
  "PinArticleContext"
);
