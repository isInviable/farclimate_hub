import type { HumanPinRow } from "~/types/pins"

interface PublicBoardProject {
  id: string
  name: string
}

interface PublicBoardResponse {
  project: PublicBoardProject
  pins: HumanPinRow[]
}

export function usePublicBoard() {
  const { t } = useI18n()
  const pins = ref<HumanPinRow[]>([])
  const project = ref<PublicBoardProject | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadPublicBoardByToken(token: string | null | undefined) {
    const trimmed = typeof token === "string" ? token.trim() : ""
    pins.value = []
    project.value = null
    error.value = null

    if (!trimmed) return

    loading.value = true
    try {
      const data = await $fetch<PublicBoardResponse>(
        `/api/public-board/${encodeURIComponent(trimmed)}`
      )
      project.value = data.project
      pins.value = data.pins
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      error.value = err.data?.message || err.message || t("publicBoard.errors.load")
      pins.value = []
      project.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    pins: readonly(pins),
    project: readonly(project),
    loading: readonly(loading),
    error: readonly(error),
    loadPublicBoardByToken,
  }
}
