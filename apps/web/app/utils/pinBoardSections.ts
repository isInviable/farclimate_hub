import type { HumanPinRow } from "~/types/pins";

export interface PinSection {
  bodyKind: string
  pins: HumanPinRow[]
}

/**
 * Groups pins by `body_kind`. Within each group: `sort_order` then `created_at`.
 * Section order: by minimum `sort_order` in that group, then `body_kind` string (stable).
 */
export function groupPinsByBodyKind(pins: HumanPinRow[]): PinSection[] {
  const byKind = new Map<string, HumanPinRow[]>();
  for (const p of pins) {
    const k = (p.body_kind || "unknown").trim() || "unknown";
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k)!.push(p);
  }
  for (const arr of byKind.values()) {
    arr.sort((a, b) => {
      const o = a.sort_order - b.sort_order;
      if (o !== 0) return o;
      return a.created_at.localeCompare(b.created_at);
    });
  }
  const kinds = [...byKind.keys()].sort((ka, kb) => {
    const minA = Math.min(...byKind.get(ka)!.map((p) => p.sort_order));
    const minB = Math.min(...byKind.get(kb)!.map((p) => p.sort_order));
    if (minA !== minB) return minA - minB;
    return ka.localeCompare(kb);
  });
  return kinds.map((bodyKind) => ({
    bodyKind,
    pins: byKind.get(bodyKind)!,
  }));
}

