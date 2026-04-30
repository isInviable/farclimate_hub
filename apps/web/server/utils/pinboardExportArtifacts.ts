import { createError } from "h3"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  artifactRowToResponse,
  type ArtifactMetadataResponse,
  type HumanArtifactRow,
} from "~/types/artifacts"

export const PINBOARD_EXPORT_KIND = "pinboard_export" as const

export async function insertPendingPinboardExportArtifact(params: {
  supabase: SupabaseClient
  artifactId: string
  projectId: string
  ownerUserId: string
  bucketId: string
  objectPath: string
  title: string | null
}): Promise<ArtifactMetadataResponse> {
  const { data, error } = await params.supabase
    .schema("human")
    .from("artifacts")
    .insert({
      id: params.artifactId,
      project_id: params.projectId,
      owner_user_id: params.ownerUserId,
      kind: PINBOARD_EXPORT_KIND,
      status: "pending",
      title: params.title,
      bucket_id: params.bucketId,
      object_path: params.objectPath,
      mime_type: "application/zip",
      byte_size: 0,
      metadata: {},
      source_pin_ids: [],
    })
    .select(
      "id, project_id, owner_user_id, kind, status, title, bucket_id, object_path, mime_type, byte_size, metadata, source_pin_ids, created_at, updated_at"
    )
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return artifactRowToResponse(data as HumanArtifactRow)
}

export async function updatePinboardExportArtifactReady(params: {
  supabase: SupabaseClient
  artifactId: string
  byteSize: number
  sourcePinIds: string[]
}): Promise<void> {
  const { error } = await params.supabase
    .schema("human")
    .from("artifacts")
    .update({
      status: "ready",
      byte_size: params.byteSize,
      mime_type: "application/zip",
      source_pin_ids: params.sourcePinIds,
    })
    .eq("id", params.artifactId)

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }
}

export async function updatePinboardExportArtifactFailed(params: {
  supabase: SupabaseClient
  artifactId: string
  message: string
}): Promise<void> {
  const { error } = await params.supabase
    .schema("human")
    .from("artifacts")
    .update({
      status: "failed",
      metadata: { export_error: params.message },
    })
    .eq("id", params.artifactId)

  if (error) {
    console.error("[pinboard-export] failed to mark artifact failed:", error.message)
  }
}
