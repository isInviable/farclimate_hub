export interface HumanArtifactRow {
  id: string
  project_id: string
  owner_user_id: string
  kind: string
  status: "pending" | "ready" | "failed"
  title: string | null
  bucket_id: string
  object_path: string
  mime_type: string
  byte_size: number
  metadata: Record<string, unknown>
  source_pin_ids: string[]
  created_at: string
  updated_at: string
}

export interface ArtifactMetadataResponse {
  id: string
  projectId: string
  kind: string
  status: HumanArtifactRow["status"]
  title: string | null
  bucketId: string
  objectPath: string
  mimeType: string
  byteSize: number
  metadata: Record<string, unknown>
  sourcePinIds: string[]
  createdAt: string
  updatedAt: string
}

export function artifactRowToResponse(row: HumanArtifactRow): ArtifactMetadataResponse {
  return {
    id: row.id,
    projectId: row.project_id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    bucketId: row.bucket_id,
    objectPath: row.object_path,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size ?? 0),
    metadata: row.metadata ?? {},
    sourcePinIds: row.source_pin_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
