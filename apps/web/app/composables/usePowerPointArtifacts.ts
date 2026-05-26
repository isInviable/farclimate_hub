import type { HumanArtifactRow } from "~/types/artifacts"
import type { PresentationStructure } from "~/types/presentationGeneration"
import { POWERPOINT_MIME_TYPE } from "~/utils/powerPointDeck"

export interface CreatePowerPointArtifactInput {
  projectId: string
  title: string
  presentation: PresentationStructure
  pptx: Blob
  sourcePinIds: string[]
  metadata?: Record<string, unknown>
}

export const POWERPOINT_ARTIFACT_BUCKET = "human-artifacts"

export function safePowerPointFilename(value: string): string {
  return (value || "powerpoint-presentation").replace(/[/\\?%*:|"<>]/g, "-")
}

export function powerPointArtifactObjectPath(params: {
  ownerUserId: string
  projectId: string
  artifactId: string
  title: string
}): string {
  return `${params.ownerUserId}/${params.projectId}/${params.artifactId}/${safePowerPointFilename(params.title)}.pptx`
}

export function powerPointArtifactMetadata(input: {
  presentation: PresentationStructure
  sourcePinIds: string[]
  metadata?: Record<string, unknown>
}): Record<string, unknown> {
  return {
    presentation: input.presentation,
    sourceCount: input.sourcePinIds.length,
    generatedAt: new Date().toISOString(),
    ...input.metadata,
  }
}

function userIdFromSession(session: unknown): string | null {
  if (!session || typeof session !== "object") return null
  const row = session as {
    user?: { id?: string }
  }
  return row.user?.id ?? null
}

export function usePowerPointArtifacts() {
  const supabase = useSupabaseClient()
  const { isAuthenticated, session } = useAccess()
  const { t } = useI18n()

  const artifacts = ref<HumanArtifactRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPowerPointArtifacts(projectId: string | null) {
    if (!projectId || !isAuthenticated.value) {
      artifacts.value = []
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      const { data, error: queryError } = await supabase
        .schema("human")
        .from("artifacts")
        .select(
          "id, project_id, owner_user_id, kind, status, title, bucket_id, object_path, mime_type, byte_size, metadata, source_pin_ids, created_at, updated_at"
        )
        .eq("project_id", projectId)
        .eq("kind", "powerpoint")
        .order("created_at", { ascending: false })

      if (queryError) throw queryError
      artifacts.value = (data ?? []) as HumanArtifactRow[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("powerpoint.artifacts.loadError")
      artifacts.value = []
    } finally {
      loading.value = false
    }
  }

  async function createPowerPointArtifact(
    input: CreatePowerPointArtifactInput
  ): Promise<HumanArtifactRow> {
    const ownerUserId = userIdFromSession(session.value)
    if (!ownerUserId) {
      throw new Error(t("pins.exports.signInRequired"))
    }

    const artifactId = crypto.randomUUID()
    const objectPath = powerPointArtifactObjectPath({
      ownerUserId,
      projectId: input.projectId,
      artifactId,
      title: input.title,
    })
    const baseMetadata = powerPointArtifactMetadata({
      presentation: input.presentation,
      sourcePinIds: input.sourcePinIds,
      metadata: input.metadata,
    })
    const pendingPayload = {
      id: artifactId,
      project_id: input.projectId,
      owner_user_id: ownerUserId,
      kind: "powerpoint",
      status: "pending",
      title: input.title || input.presentation.title,
      bucket_id: POWERPOINT_ARTIFACT_BUCKET,
      object_path: objectPath,
      mime_type: POWERPOINT_MIME_TYPE,
      byte_size: 0,
      metadata: baseMetadata,
      source_pin_ids: input.sourcePinIds,
    }

    const { data: inserted, error: insertError } = await supabase
      .schema("human")
      .from("artifacts")
      .insert(pendingPayload)
      .select(
        "id, project_id, owner_user_id, kind, status, title, bucket_id, object_path, mime_type, byte_size, metadata, source_pin_ids, created_at, updated_at"
      )
      .single()

    if (insertError) throw insertError

    try {
      const { error: uploadError } = await supabase.storage
        .from(POWERPOINT_ARTIFACT_BUCKET)
        .upload(objectPath, input.pptx, {
          contentType: POWERPOINT_MIME_TYPE,
          upsert: false,
        })
      if (uploadError) throw uploadError

      const { data: ready, error: updateError } = await supabase
        .schema("human")
        .from("artifacts")
        .update({
          status: "ready",
          byte_size: input.pptx.size,
          metadata: baseMetadata,
        })
        .eq("id", artifactId)
        .select(
          "id, project_id, owner_user_id, kind, status, title, bucket_id, object_path, mime_type, byte_size, metadata, source_pin_ids, created_at, updated_at"
        )
        .single()

      if (updateError) throw updateError
      await fetchPowerPointArtifacts(input.projectId)
      return ready as HumanArtifactRow
    } catch (e) {
      const message = e instanceof Error ? e.message : "PowerPoint upload failed"
      await supabase
        .schema("human")
        .from("artifacts")
        .update({
          status: "failed",
          metadata: {
            ...baseMetadata,
            generation_error: message,
          },
        })
        .eq("id", artifactId)
      throw e
    }
  }

  async function signedUrlForPowerPoint(
    artifact: Pick<HumanArtifactRow, "bucket_id" | "object_path" | "title">,
    download = false
  ): Promise<string | null> {
    error.value = null
    try {
      const baseName = safePowerPointFilename(artifact.title || "powerpoint-presentation")
      const { data, error: signedUrlError } = await supabase.storage
        .from(artifact.bucket_id)
        .createSignedUrl(artifact.object_path, 60 * 10, {
          download: download ? `${baseName}.pptx` : false,
        })
      if (signedUrlError) throw signedUrlError
      return data?.signedUrl ?? null
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("common.requestFailed")
      return null
    }
  }

  return {
    artifacts: readonly(artifacts),
    loading: readonly(loading),
    error: readonly(error),
    fetchPowerPointArtifacts,
    createPowerPointArtifact,
    signedUrlForPowerPoint,
  }
}
