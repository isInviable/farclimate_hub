import type { HumanArtifactRow } from "~/types/artifacts"

export function usePinboardExportArtifacts() {
  const supabase = useSupabaseClient()
  const { isAuthenticated } = useAccess()
  const { t } = useI18n()

  const artifacts = ref<HumanArtifactRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPinboardExports(projectId: string | null) {
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
        .eq("kind", "pinboard_export")
        .order("created_at", { ascending: false })

      if (queryError) throw queryError
      artifacts.value = (data ?? []) as HumanArtifactRow[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("podcast.artifacts.downloadsLoadError")
      artifacts.value = []
    } finally {
      loading.value = false
    }
  }

  async function signedUrlForExport(
    artifact: Pick<HumanArtifactRow, "bucket_id" | "object_path" | "title">,
    download = false
  ): Promise<string | null> {
    error.value = null
    try {
      const baseName = (artifact.title || "pinboard-export").replace(/[/\\?%*:|"<>]/g, "-")
      const { data, error: signedUrlError } = await supabase.storage
        .from(artifact.bucket_id)
        .createSignedUrl(artifact.object_path, 60 * 10, {
          download: download ? `${baseName}.zip` : false,
        })
      if (signedUrlError) throw signedUrlError
      return data?.signedUrl ?? null
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("podcast.artifacts.downloadGenerateError")
      return null
    }
  }

  return {
    artifacts: readonly(artifacts),
    loading: readonly(loading),
    error: readonly(error),
    fetchPinboardExports,
    signedUrlForExport,
  }
}
