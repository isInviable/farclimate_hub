import type { HumanPinRow } from "~/types/pins";

/**
 * A group of pins belonging to the same source document, aggregated for the
 * pinboard map view. One group → one marker.
 */
export interface PinMapGroup {
  /** Stable `source_document_uid` shared by every pin in the group. */
  documentUid: string;
  /**
   * Display title. Taken from the first pin's `source_title_snapshot`. When
   * that snapshot is missing, falls back to an empty string; the caller is
   * expected to render a localised fallback (e.g. `pins.noTitle`).
   */
  title: string;
  /** `[latitude, longitude]` picked from the first pin with a valid snapshot. */
  location: [number, number];
  /** All pins that contributed to this group, in the order received. */
  pins: HumanPinRow[];
}

/**
 * Validate a `body.data.location` payload.
 *
 * Mirrors the rules already applied by the explorer map:
 * tuple of two finite numbers, latitude in `[-90, 90]`, longitude in
 * `[-180, 180]`, and `[0, 0]` is treated as a non-geographic placeholder.
 */
export function isValidPinLocation(
  loc: unknown
): loc is [number, number] {
  if (!Array.isArray(loc) || loc.length !== 2) return false;
  const [lat, lon] = loc;
  if (typeof lat !== "number" || typeof lon !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  if (lat === 0 && lon === 0) return false;
  return true;
}

/**
 * Group pins by `source_document_uid` for the pinboard map view.
 *
 * - Pins without a `source_document_uid` are skipped (a marker requires an
 *   article identity).
 * - A group is emitted only when at least one of its pins carries a valid
 *   `body.data.location`. The group's coordinates come from that first valid
 *   location; later variations are ignored deterministically.
 * - The group's `title` is taken from the first pin's `source_title_snapshot`
 *   (empty string if missing; caller resolves a localised fallback).
 */
export function groupPinsForMap(pins: HumanPinRow[]): PinMapGroup[] {
  const byUid = new Map<string, HumanPinRow[]>();
  for (const pin of pins) {
    const uid = pin.source_document_uid;
    if (!uid) continue;
    if (!byUid.has(uid)) byUid.set(uid, []);
    byUid.get(uid)!.push(pin);
  }

  const groups: PinMapGroup[] = [];
  for (const [uid, groupPins] of byUid) {
    let location: [number, number] | null = null;
    for (const pin of groupPins) {
      const raw = (pin.body?.data as Record<string, unknown> | undefined)
        ?.location;
      if (isValidPinLocation(raw)) {
        location = raw;
        break;
      }
    }
    if (!location) continue;
    const title = groupPins[0]?.source_title_snapshot?.trim() || "";
    groups.push({
      documentUid: uid,
      title,
      location,
      pins: groupPins,
    });
  }
  return groups;
}
