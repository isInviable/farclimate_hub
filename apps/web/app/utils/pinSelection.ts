import type { HumanPinRow } from "~/types/pins";
import type { SelectedItem } from "@/stores/selection";

/**
 * Maps a DB pin to `PinnedSelectionStore` item for ActionBar modals (chat expects `type === 'result'` + document-like `data`).
 */
export function pinToSelectionItem(pin: HumanPinRow): SelectedItem {
  const d = (pin.body?.data ?? {}) as Record<string, unknown>;
  const isResultLike =
    pin.body_kind === "text_segment" ||
    pin.body_kind === "document" ||
    pin.body_kind === "section";

  const fulltext =
    typeof d.markdown === "string"
      ? d.markdown
      : typeof d.fulltext === "string"
        ? d.fulltext
        : "";

  const document = {
    ...d,
    id: pin.id,
    title: pin.source_title_snapshot ?? "",
    fulltext,
    document_uid: pin.source_document_uid ?? undefined,
  };

  return {
    id: pin.id,
    title: pin.source_title_snapshot?.trim() || "(no title)",
    type: isResultLike ? "result" : "other",
    data: document,
  };
}
