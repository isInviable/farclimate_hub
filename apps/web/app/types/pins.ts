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

export interface PinBodyV1 {
  v: 1
  data: Record<string, unknown>
}

export function emptyPinBody(): PinBodyV1 {
  return { v: 1, data: {} }
}
