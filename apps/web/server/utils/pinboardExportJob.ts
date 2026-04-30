import type { SupabaseClient } from "@supabase/supabase-js"
import { removeArtifactObject, uploadArtifactAudio } from "./podcastSupabase"
import { fetchArticleJsonByDocumentUid } from "./pinboardExportKnowledge"
import {
  updatePinboardExportArtifactFailed,
  updatePinboardExportArtifactReady,
} from "./pinboardExportArtifacts"
import { buildPinboardExportZipBuffer } from "./pinboardExportZip"
import type { HumanPinRow } from "~/types/pins"

export interface RunPinboardExportJobParams {
  supabase: SupabaseClient
  userId: string
  projectId: string
  artifactId: string
  bucketId: string
  objectPath: string
  documentLang?: string
}

export async function runPinboardExportJob(params: RunPinboardExportJobParams): Promise<void> {
  const lang = params.documentLang ?? "en"
  let uploaded = false

  try {
    const { data: board, error: boardError } = await params.supabase
      .schema("human")
      .from("pinboards")
      .select("id")
      .eq("project_id", params.projectId)
      .maybeSingle()

    if (boardError) throw new Error(boardError.message)
    if (!board?.id) throw new Error("Pinboard not found for project")

    const { data: pinRows, error: pinsError } = await params.supabase
      .schema("human")
      .from("pins")
      .select(
        "id, pinboard_id, source_document_uid, source_title_snapshot, body_kind, body, user_note, sort_order, created_at, updated_at"
      )
      .eq("pinboard_id", board.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (pinsError) throw new Error(pinsError.message)
    const pins = (pinRows ?? []) as HumanPinRow[]

    const zipBytes = await buildPinboardExportZipBuffer({
      projectId: params.projectId,
      pinboardId: board.id,
      pins,
      fetchArticleJson: (uid) => fetchArticleJsonByDocumentUid(uid, lang),
    })

    await uploadArtifactAudio({
      supabase: params.supabase,
      bucketId: params.bucketId,
      objectPath: params.objectPath,
      audio: zipBytes,
      contentType: "application/zip",
    })
    uploaded = true

    await updatePinboardExportArtifactReady({
      supabase: params.supabase,
      artifactId: params.artifactId,
      byteSize: zipBytes.byteLength,
      sourcePinIds: pins.map((p) => p.id),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Pinboard export failed"
    console.error("[pinboard-export]", message, e)
    if (uploaded) {
      await removeArtifactObject({
        supabase: params.supabase,
        bucketId: params.bucketId,
        objectPath: params.objectPath,
      })
    }
    await updatePinboardExportArtifactFailed({
      supabase: params.supabase,
      artifactId: params.artifactId,
      message,
    })
  }
}

export function schedulePinboardExportJob(params: RunPinboardExportJobParams): void {
  setImmediate(() => {
    void runPinboardExportJob(params).catch((err) => {
      console.error("[pinboard-export] unhandled job error", err)
    })
  })
}
