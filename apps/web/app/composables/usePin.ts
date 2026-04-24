import { ref } from "vue";
import { usePinsSupabase } from "~/composables/usePinsSupabase";
import { emptyPinBody } from "~/types/pins";
import { isValidPinLocation } from "~/utils/pinBoardMap";

export interface PinContentOverrides {
  /** Stored as `human.pins.source_document_uid` when pinning a search/article row. */
  sourceDocumentUid?: string | null;
  title?: string;
  /** Maps to legacy UI types; drives `body_kind` when not overridden. */
  type?: "result" | "contact" | "image" | "website" | "other";
  data?: Record<string, unknown>;
  notes?: string;
  /** Override detected body kind (e.g. `text_segment`). */
  bodyKind?: string;
  /**
   * Optional `[latitude, longitude]` snapshot of the parent document's
   * location. When provided and valid (see `isValidPinLocation`) it is
   * written into `body.data.location`; the pinboard map view reads this
   * field to render one marker per article. See change
   * `pinboard-global-map`.
   */
  location?: [number, number] | null;
}

export function usePin() {
  const pinsApi = usePinsSupabase();
  const projectsStore = useProjectsStore();
  const isAnimating = ref(false);

  function bodyKindFromElement(
    el: HTMLElement,
    overrides?: PinContentOverrides
  ): string {
    if (overrides?.bodyKind) return overrides.bodyKind;
    if (el.tagName === "IMG") return "image";
    const t = overrides?.type;
    if (t === "website") return "website";
    if (t === "contact") return "contact";
    if (t === "result") return "text_segment";
    return "text_segment";
  }

  function bodyDataFromElement(
    el: HTMLElement,
    overrides?: PinContentOverrides
  ): Record<string, unknown> {
    const base = overrides?.data ? { ...overrides.data } : {};
    if (el.tagName === "IMG") {
      const img = el as HTMLImageElement;
      return { ...base, src: img.src, alt: img.alt || "" };
    }
    const text = (el.innerText || el.textContent || "").slice(0, 8000);
    return { ...base, markdown: text };
  }

  /**
   * Creates a pin in the current project. Returns new pin id or null.
   */
  async function pinContent(
    element: HTMLElement,
    overrides?: PinContentOverrides
  ): Promise<string | null> {
    const projectId = projectsStore.currentProject?.id;
    if (!projectId) return null;

    const body_kind = bodyKindFromElement(element, overrides);
    const data = bodyDataFromElement(element, overrides);
    if (isValidPinLocation(overrides?.location)) {
      data.location = overrides!.location;
    }
    const body = { ...emptyPinBody(), data };

    const row = await pinsApi.createPin({
      projectId,
      body_kind,
      body,
      source_document_uid: overrides?.sourceDocumentUid ?? null,
      source_title_snapshot: overrides?.title ?? null,
      user_note: overrides?.notes ?? null,
    });

    if (row) await animatePin(element);
    return row?.id ?? null;
  }

  async function unpinContent(id: string): Promise<boolean> {
    return pinsApi.deletePin(id);
  }

  /** True if `id` is a pin row id or a `source_document_uid`. */
  function isPinned(id: string): boolean {
    return pinsApi.pins.value.some(
      (p) => p.id === id || p.source_document_uid === id
    );
  }

  async function animatePin(element: HTMLElement) {
    if (isAnimating.value) return;

    isAnimating.value = true;

    const clone = element.cloneNode(true) as HTMLElement;
    const rect = element.getBoundingClientRect();

    Object.assign(clone.style, {
      position: "fixed",
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: "scale(1)",
      opacity: "1",
      transition: "all 0.5s ease-in-out",
      zIndex: "9999",
      pointerEvents: "none",
    });

    document.body.appendChild(clone);
    clone.offsetHeight;

    Object.assign(clone.style, {
      transform: "scale(0.2)",
      opacity: "0",
      top: "20px",
      right: "20px",
    });

    setTimeout(() => {
      clone.remove();
      isAnimating.value = false;
    }, 500);
  }

  return {
    pinContent,
    unpinContent,
    isPinned,
    isAnimating,
  };
}
