import { randomBytes } from "node:crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createError } from "h3"
import type { HumanPinRow } from "~/types/pins"

export interface PublicBoardProject {
  id: string
  name: string
}

export interface PublicBoardResponse {
  project: PublicBoardProject
  pins: HumanPinRow[]
}

export interface PublicBoardShareResponse {
  token: string
  path: string
}

interface ShareLinkRow {
  id: string
  project_id: string
  token: string
  enabled: boolean
  revoked_at: string | null
}

interface ProjectRow {
  id: string
  name: string | null
}

interface PinboardRow {
  id: string
}

export const PUBLIC_BOARD_TOKEN_BYTES = 32
export const PUBLIC_BOARD_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,}$/

export function generatePublicBoardToken(): string {
  return randomBytes(PUBLIC_BOARD_TOKEN_BYTES).toString("base64url")
}

export function normalizePublicBoardToken(input: string | undefined | null): string {
  const token = typeof input === "string" ? input.trim() : ""
  if (!PUBLIC_BOARD_TOKEN_PATTERN.test(token)) {
    throw createError({
      statusCode: 400,
      message: "Invalid public board token",
    })
  }
  return token
}

export function publicBoardPath(token: string): string {
  return `/explorer/board/public/${encodeURIComponent(token)}`
}

export function createServiceSupabaseClient(): SupabaseClient {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.supabaseServiceRoleKey as string
  if (!url || !key) {
    const missing = [
      !url && "SUPABASE_URL",
      !key && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean)
    throw createError({
      statusCode: 500,
      message: `Supabase service role configuration is missing (${missing.join(", ")}). Set in apps/web/.env or the repo root .env, then restart the dev server.`,
    })
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export async function findEnabledShareLinkByProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<ShareLinkRow | null> {
  const { data, error } = await supabase
    .schema("human")
    .from("project_share_links")
    .select("id, project_id, token, enabled, revoked_at")
    .eq("project_id", projectId)
    .eq("enabled", true)
    .is("revoked_at", null)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return (data as ShareLinkRow | null) ?? null
}

export async function createShareLink(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  maxAttempts = 5
): Promise<ShareLinkRow> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = generatePublicBoardToken()
    if (token === projectId) continue

    const { data, error } = await supabase
      .schema("human")
      .from("project_share_links")
      .insert({
        project_id: projectId,
        token,
        created_by: userId,
      })
      .select("id, project_id, token, enabled, revoked_at")
      .single()

    if (!error && data) return data as ShareLinkRow

    const code = (error as { code?: string } | null)?.code
    if (code === "23505") {
      const existing = await findEnabledShareLinkByProject(supabase, projectId)
      if (existing) return existing
      continue
    }

    throw createError({
      statusCode: 500,
      message: error?.message ?? "Failed to create public board share link",
    })
  }

  throw createError({
    statusCode: 500,
    message: "Failed to generate a unique public board token",
  })
}

export async function getOrCreateShareLinkForProject(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<ShareLinkRow> {
  const existing = await findEnabledShareLinkByProject(supabase, projectId)
  if (existing) return existing
  return createShareLink(supabase, projectId, userId)
}

export async function loadPublicBoardByToken(
  supabase: SupabaseClient,
  token: string | undefined | null
): Promise<PublicBoardResponse> {
  const normalizedToken = normalizePublicBoardToken(token)

  const { data: share, error: shareError } = await supabase
    .schema("human")
    .from("project_share_links")
    .select("project_id, enabled, revoked_at")
    .eq("token", normalizedToken)
    .maybeSingle()

  if (shareError) {
    throw createError({
      statusCode: 500,
      message: shareError.message,
    })
  }

  const shareRow = share as Pick<ShareLinkRow, "project_id" | "enabled" | "revoked_at"> | null
  if (!shareRow || !shareRow.enabled || shareRow.revoked_at) {
    throw createError({
      statusCode: 404,
      message: "Public board not found",
    })
  }

  const { data: project, error: projectError } = await supabase
    .schema("human")
    .from("projects")
    .select("id, name")
    .eq("id", shareRow.project_id)
    .maybeSingle()

  if (projectError) {
    throw createError({
      statusCode: 500,
      message: projectError.message,
    })
  }
  if (!project) {
    throw createError({
      statusCode: 404,
      message: "Public board project not found",
    })
  }

  const projectRow = project as ProjectRow
  const { data: pinboard, error: pinboardError } = await supabase
    .schema("human")
    .from("pinboards")
    .select("id")
    .eq("project_id", projectRow.id)
    .maybeSingle()

  if (pinboardError) {
    throw createError({
      statusCode: 500,
      message: pinboardError.message,
    })
  }

  const pinboardRow = pinboard as PinboardRow | null
  if (!pinboardRow) {
    return {
      project: { id: projectRow.id, name: projectRow.name?.trim() || "Unnamed Project" },
      pins: [],
    }
  }

  const { data: pins, error: pinsError } = await supabase
    .schema("human")
    .from("pins")
    .select("id, pinboard_id, source_document_uid, source_title_snapshot, body_kind, body, user_note, sort_order, created_at, updated_at")
    .eq("pinboard_id", pinboardRow.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (pinsError) {
    throw createError({
      statusCode: 500,
      message: pinsError.message,
    })
  }

  return {
    project: { id: projectRow.id, name: projectRow.name?.trim() || "Unnamed Project" },
    pins: (pins ?? []) as HumanPinRow[],
  }
}
