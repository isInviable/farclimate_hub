import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createError, getHeader, type H3Event } from "h3"
import {
  artifactRowToResponse,
  type ArtifactMetadataResponse,
  type HumanArtifactRow,
} from "~/types/artifacts"

export interface AuthenticatedSupabaseContext {
  supabase: SupabaseClient
  userId: string
}

export interface InsertPodcastArtifactInput {
  id: string
  projectId: string
  ownerUserId: string
  title: string | null
  bucketId: string
  objectPath: string
  byteSize: number
  metadata: Record<string, unknown>
  sourcePinIds: string[]
}

export function bearerTokenFromEvent(event: H3Event): string {
  const header = getHeader(event, "authorization") ?? ""
  const match = /^Bearer\s+(.+)$/i.exec(header)
  if (!match?.[1]) {
    throw createError({
      statusCode: 401,
      message: "Missing Authorization bearer token",
    })
  }
  return match[1]
}

export function createUserSupabaseClient(token: string): SupabaseClient {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabasePublishableKey as string
  if (!url || !key) {
    throw createError({
      statusCode: 500,
      message: "Supabase runtime configuration is missing",
    })
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

export async function authenticatedSupabaseFromEvent(
  event: H3Event
): Promise<AuthenticatedSupabaseContext> {
  const token = bearerTokenFromEvent(event)
  const supabase = createUserSupabaseClient(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw createError({
      statusCode: 401,
      message: error?.message ?? "Invalid Supabase session",
    })
  }
  return { supabase, userId: data.user.id }
}

export async function assertOwnProject(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<void> {
  const { data, error } = await supabase
    .schema("human")
    .from("projects")
    .select("id, owner_user_id")
    .eq("id", projectId)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }
  if (!data || data.owner_user_id !== userId) {
    throw createError({
      statusCode: 403,
      message: "Project not found or not owned by current user",
    })
  }
}

export function podcastArtifactObjectPath(params: {
  ownerUserId: string
  projectId: string
  artifactId: string
  filename?: string
}): string {
  return `${params.ownerUserId}/${params.projectId}/${params.artifactId}/${params.filename ?? "podcast.mp3"}`
}

export async function uploadArtifactAudio(params: {
  supabase: SupabaseClient
  bucketId: string
  objectPath: string
  audio: Uint8Array
  contentType?: string
}): Promise<void> {
  const { error } = await params.supabase.storage
    .from(params.bucketId)
    .upload(params.objectPath, params.audio, {
      contentType: params.contentType ?? "audio/mpeg",
      upsert: false,
    })
  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }
}

export async function removeArtifactObject(params: {
  supabase: SupabaseClient
  bucketId: string
  objectPath: string
}): Promise<void> {
  const { error } = await params.supabase.storage
    .from(params.bucketId)
    .remove([params.objectPath])
  if (error) {
    console.error("Failed to clean up artifact object", error)
  }
}

export async function insertPodcastArtifact(
  supabase: SupabaseClient,
  input: InsertPodcastArtifactInput
): Promise<ArtifactMetadataResponse> {
  const { data, error } = await supabase
    .schema("human")
    .from("artifacts")
    .insert({
      id: input.id,
      project_id: input.projectId,
      owner_user_id: input.ownerUserId,
      kind: "podcast",
      status: "ready",
      title: input.title,
      bucket_id: input.bucketId,
      object_path: input.objectPath,
      mime_type: "audio/mpeg",
      byte_size: input.byteSize,
      metadata: input.metadata,
      source_pin_ids: input.sourcePinIds,
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
