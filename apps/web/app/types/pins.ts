/** Row shape from `human.pins` (PostgREST). */
export interface HumanPinRow {
  id: string
  pinboard_id: string
  source_document_uid: string | null
  source_title_snapshot: string | null
  body_kind: string
  body: PinBodyV1
  user_note: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * Pin body envelope. Intentionally open-shaped; each `body_kind` may persist
 * its own fields inside `data`.
 *
 * Recognised `data` fields (not enforced by this type):
 * - `src`, `alt` — image pins (set from the source `<img>` element).
 * - `markdown` — text/contact/website pins (set from element text).
 * - `location?: [latitude, longitude]` — snapshot of the parent document's
 *   geographic coordinates, stamped by article-aware pin-creation surfaces
 *   (see change `pinboard-global-map`). Consumers (e.g. the pinboard map
 *   view) derive markers from this field. Written only when the parent
 *   `document.location` passes the explorer's validity rules (finite lat in
 *   [-90, 90], finite lon in [-180, 180], excluding `[0, 0]`).
 */
export interface PinBodyV1 {
  v: 1
  data: Record<string, unknown>
}

export function emptyPinBody(): PinBodyV1 {
  return { v: 1, data: {} }
}
