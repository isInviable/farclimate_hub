import type { HumanPinRow } from "~/types/pins";

export interface FragmentBackedPaperGroup {
  source_document_uid: string;
  displayTitle: string;
  pins: HumanPinRow[];
}

function sortPinsStable(pins: HumanPinRow[]): HumanPinRow[] {
  return [...pins].sort((a, b) => {
    const o = a.sort_order - b.sort_order;
    if (o !== 0) return o;
    return a.created_at.localeCompare(b.created_at);
  });
}

function bestTitleForPins(pins: HumanPinRow[]): string {
  for (const p of pins) {
    const s = p.source_title_snapshot?.trim();
    if (s) return s;
  }
  return "";
}

/**
 * Full-paper pins only, same ordering as `groupPinsByBodyKind` per kind.
 */
export function fullPaperDocumentPinsSorted(pins: HumanPinRow[]): HumanPinRow[] {
  return sortPinsStable(pins.filter((p) => p.body_kind === "document"));
}

/**
 * Papers that have at least one non-`document` pin with a non-empty
 * `source_document_uid`, grouped by that uid (one row per paper).
 */
export function groupFragmentPinsByDocumentUid(
  pins: HumanPinRow[],
): FragmentBackedPaperGroup[] {
  const byUid = new Map<string, HumanPinRow[]>();
  for (const p of pins) {
    if (p.body_kind === "document") continue;
    const uid = p.source_document_uid?.trim();
    if (!uid) continue;
    if (!byUid.has(uid)) byUid.set(uid, []);
    byUid.get(uid)!.push(p);
  }
  const groups: FragmentBackedPaperGroup[] = [];
  for (const [source_document_uid, raw] of byUid) {
    const sorted = sortPinsStable(raw);
    const title = bestTitleForPins(sorted);
    groups.push({
      source_document_uid,
      displayTitle: title || source_document_uid,
      pins: sorted,
    });
  }
  groups.sort((a, b) => {
    const minA = Math.min(...a.pins.map((p) => p.sort_order));
    const minB = Math.min(...b.pins.map((p) => p.sort_order));
    if (minA !== minB) return minA - minB;
    return a.source_document_uid.localeCompare(b.source_document_uid);
  });
  return groups;
}
