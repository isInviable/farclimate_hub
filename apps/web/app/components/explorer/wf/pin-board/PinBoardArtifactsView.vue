<template>
  <section class="space-y-8">
    <UCard>
      <template #header>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ $t("podcast.artifacts.title") }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ $t("podcast.artifacts.description") }}
          </p>
        </div>
      </template>

      <div class="space-y-10">
        <!-- Podcasts -->
        <div class="space-y-4">
          <div>
            <h3 class="flex items-center gap-2 text-lg font-medium text-gray-900">
              <UIcon name="i-heroicons-speaker-wave" class="h-5 w-5 text-primary-500" />
              {{ $t("podcast.artifacts.podcastsTitle") }}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ $t("podcast.artifacts.audioDescription") }}
            </p>
          </div>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            :title="$t('podcast.artifacts.loadError')"
            :description="error"
          />

          <div v-if="loading" class="flex items-center gap-3 py-6 text-gray-600">
            <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
            <span>{{ $t("podcast.artifacts.loading") }}</span>
          </div>

          <UAlert
            v-else-if="podcasts.length === 0"
            color="neutral"
            variant="soft"
            icon="i-heroicons-information-circle"
            :title="$t('podcast.artifacts.emptyTitle')"
            :description="$t('podcast.artifacts.emptyDescription')"
          />

          <div v-else class="grid gap-4 md:grid-cols-2">
            <UCard
              v-for="podcast in podcasts"
              :key="podcast.id"
              variant="subtle"
            >
              <div class="space-y-3">
                <div>
                  <h4 class="font-semibold text-gray-900">
                    {{ podcast.title || $t("podcast.artifacts.untitled") }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(podcast.created_at) }}
                    <span v-if="podcast.byte_size">
                      · {{ formatBytes(podcast.byte_size) }}
                    </span>
                  </p>
                </div>

                <ClientOnly>
                  <audio
                    v-if="audioUrls[podcast.id]"
                    :src="audioUrls[podcast.id]"
                    controls
                    class="w-full"
                  />
                  <UButton
                    v-else
                    type="button"
                    variant="soft"
                    color="primary"
                    size="sm"
                    :loading="loadingLinks[podcast.id]"
                    @click="loadAudioUrl(podcast)"
                  >
                    {{ $t("podcast.artifacts.loadAudio") }}
                  </UButton>
                </ClientOnly>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    type="button"
                    size="sm"
                    variant="outline"
                    icon="i-heroicons-arrow-down-tray"
                    :loading="downloading[podcast.id]"
                    @click="downloadPodcast(podcast)"
                  >
                    {{ $t("podcast.artifacts.download") }}
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- PowerPoint presentations -->
        <div class="space-y-4 border-t border-gray-100 pt-8">
          <div>
            <h3 class="flex items-center gap-2 text-lg font-medium text-gray-900">
              <UIcon name="i-lucide-presentation" class="h-5 w-5 text-primary-500" />
              {{ $t("powerpoint.artifacts.title") }}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ $t("powerpoint.artifacts.description") }}
            </p>
          </div>

          <UAlert
            v-if="powerPointsError"
            color="error"
            variant="soft"
            :title="$t('powerpoint.artifacts.loadError')"
            :description="powerPointsError"
          />

          <div
            v-if="powerPointsLoading"
            class="flex items-center gap-3 py-4 text-gray-600"
          >
            <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
            <span>{{ $t("powerpoint.artifacts.loading") }}</span>
          </div>

          <UAlert
            v-else-if="powerPoints.length === 0"
            color="neutral"
            variant="soft"
            icon="i-heroicons-information-circle"
            :title="$t('powerpoint.artifacts.emptyTitle')"
            :description="$t('powerpoint.artifacts.emptyDescription')"
          />

          <div v-else class="grid gap-4 md:grid-cols-2">
            <UCard
              v-for="ppt in powerPoints"
              :key="ppt.id"
              variant="subtle"
            >
              <div class="space-y-3">
                <div>
                  <h4 class="font-semibold text-gray-900">
                    {{ ppt.title || $t("powerpoint.artifacts.untitled") }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(ppt.created_at) }}
                    <span v-if="ppt.status === 'pending'">
                      · {{ $t("powerpoint.artifacts.statusPending") }}
                    </span>
                    <span v-else-if="ppt.status === 'failed'">
                      · {{ $t("powerpoint.artifacts.statusFailed") }}
                    </span>
                    <span v-else-if="ppt.byte_size">
                      · {{ formatBytes(ppt.byte_size) }}
                    </span>
                  </p>
                </div>

                <UBadge
                  v-if="ppt.status !== 'ready'"
                  :color="ppt.status === 'failed' ? 'error' : 'warning'"
                  variant="subtle"
                >
                  {{ ppt.status }}
                </UBadge>

                <div v-if="ppt.status === 'failed' && artifactFailureMessage(ppt)" class="text-sm text-red-700">
                  {{ artifactFailureMessage(ppt) }}
                </div>

                <UButton
                  v-if="ppt.status === 'ready'"
                  type="button"
                  size="sm"
                  variant="outline"
                  icon="i-heroicons-arrow-down-tray"
                  :loading="downloadingPowerPoint[ppt.id]"
                  @click="downloadPowerPoint(ppt)"
                >
                  {{ $t("podcast.artifacts.download") }}
                </UButton>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Downloads (pinboard ZIP exports) -->
        <div class="space-y-4 border-t border-gray-100 pt-8">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 class="flex items-center gap-2 text-lg font-medium text-gray-900">
                <UIcon name="i-lucide-archive" class="h-5 w-5 text-primary-500" />
                {{ $t("podcast.artifacts.downloadsTitle") }}
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ $t("podcast.artifacts.downloadsDescription") }}
              </p>
            </div>
            <UButton
              type="button"
              color="primary"
              icon="i-heroicons-arrow-down-tray"
              :loading="generatingDownload"
              :disabled="!canGenerateDownload"
              class="shrink-0"
              @click="emit('generateDownload')"
            >
              {{ $t("podcast.artifacts.generateDownload") }}
            </UButton>
          </div>

          <UAlert
            v-if="generateDownloadError"
            color="error"
            variant="soft"
            :title="$t('podcast.artifacts.downloadGenerateError')"
            :description="generateDownloadError"
          />

          <UAlert
            v-if="pinboardExportsError"
            color="error"
            variant="soft"
            :title="$t('podcast.artifacts.downloadsLoadError')"
            :description="pinboardExportsError"
          />

          <div
            v-if="pinboardExportsLoading"
            class="flex items-center gap-3 py-4 text-gray-600"
          >
            <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
            <span>{{ $t("podcast.artifacts.downloadsLoading") }}</span>
          </div>

          <UAlert
            v-else-if="pinboardExports.length === 0"
            color="neutral"
            variant="soft"
            icon="i-heroicons-information-circle"
            :title="$t('podcast.artifacts.downloadsEmptyTitle')"
            :description="$t('podcast.artifacts.downloadsEmptyDescription')"
          />

          <div v-else class="grid gap-4 md:grid-cols-2">
            <UCard
              v-for="exp in pinboardExports"
              :key="exp.id"
              variant="subtle"
            >
              <div class="space-y-3">
                <div>
                  <h4 class="font-semibold text-gray-900">
                    {{ exp.title || $t("podcast.artifacts.downloadUntitled") }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(exp.created_at) }}
                    <span v-if="exp.status === 'pending'">
                      · {{ $t("podcast.artifacts.downloadStatusPending") }}
                    </span>
                    <span v-else-if="exp.status === 'failed'">
                      · {{ $t("podcast.artifacts.downloadStatusFailed") }}
                    </span>
                    <span v-else-if="exp.byte_size">
                      · {{ formatBytes(exp.byte_size) }}
                    </span>
                  </p>
                </div>

                <UBadge
                  v-if="exp.status !== 'ready'"
                  :color="exp.status === 'failed' ? 'error' : 'warning'"
                  variant="subtle"
                >
                  {{ exp.status }}
                </UBadge>

                <div v-if="exp.status === 'failed' && exportFailureMessage(exp)" class="text-sm text-red-700">
                  {{ exportFailureMessage(exp) }}
                </div>

                <UButton
                  v-if="exp.status === 'ready'"
                  type="button"
                  size="sm"
                  variant="outline"
                  icon="i-heroicons-arrow-down-tray"
                  :loading="downloadingExport[exp.id]"
                  @click="downloadExport(exp)"
                >
                  {{ $t("podcast.artifacts.download") }}
                </UButton>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import type { HumanArtifactRow } from "~/types/artifacts"

const props = withDefaults(
  defineProps<{
    podcasts: readonly HumanArtifactRow[]
    loading?: boolean
    error?: string | null
    pinboardExports?: readonly HumanArtifactRow[]
    pinboardExportsLoading?: boolean
    pinboardExportsError?: string | null
    powerPoints?: readonly HumanArtifactRow[]
    powerPointsLoading?: boolean
    powerPointsError?: string | null
    generatingDownload?: boolean
    canGenerateDownload?: boolean
    generateDownloadError?: string | null
  }>(),
  {
    pinboardExports: () => [],
    pinboardExportsLoading: false,
    pinboardExportsError: null,
    powerPoints: () => [],
    powerPointsLoading: false,
    powerPointsError: null,
    generatingDownload: false,
    canGenerateDownload: true,
    generateDownloadError: null,
  }
)

const emit = defineEmits<{
  generateDownload: []
}>()

const podcastArtifacts = usePodcastArtifacts()
const pinboardExportArtifacts = usePinboardExportArtifacts()
const powerPointArtifacts = usePowerPointArtifacts()

const audioUrls = ref<Record<string, string>>({})
const loadingLinks = ref<Record<string, boolean>>({})
const downloading = ref<Record<string, boolean>>({})
const downloadingExport = ref<Record<string, boolean>>({})
const downloadingPowerPoint = ref<Record<string, boolean>>({})

watch(
  () => props.podcasts.map((podcast) => podcast.id).join(","),
  () => {
    const ids = new Set(props.podcasts.map((podcast) => podcast.id))
    audioUrls.value = Object.fromEntries(
      Object.entries(audioUrls.value).filter(([id]) => ids.has(id))
    )
  }
)

watch(
  () => props.pinboardExports.map((e) => e.id).join(","),
  () => {
    const ids = new Set(props.pinboardExports.map((e) => e.id))
    downloadingExport.value = Object.fromEntries(
      Object.entries(downloadingExport.value).filter(([id]) => ids.has(id))
    )
  }
)

watch(
  () => props.powerPoints.map((ppt) => ppt.id).join(","),
  () => {
    const ids = new Set(props.powerPoints.map((ppt) => ppt.id))
    downloadingPowerPoint.value = Object.fromEntries(
      Object.entries(downloadingPowerPoint.value).filter(([id]) => ids.has(id))
    )
  }
)

async function loadAudioUrl(podcast: HumanArtifactRow) {
  loadingLinks.value = { ...loadingLinks.value, [podcast.id]: true }
  try {
    const url = await podcastArtifacts.signedUrlForArtifact(podcast)
    if (url) {
      audioUrls.value = { ...audioUrls.value, [podcast.id]: url }
    }
  } finally {
    loadingLinks.value = { ...loadingLinks.value, [podcast.id]: false }
  }
}

async function downloadPodcast(podcast: HumanArtifactRow) {
  downloading.value = { ...downloading.value, [podcast.id]: true }
  try {
    const url = await podcastArtifacts.signedUrlForArtifact(podcast, true)
    if (!url) return
    const link = document.createElement("a")
    link.href = url
    link.download = `${podcast.title || "podcast"}.mp3`
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    downloading.value = { ...downloading.value, [podcast.id]: false }
  }
}

async function downloadExport(exp: HumanArtifactRow) {
  downloadingExport.value = { ...downloadingExport.value, [exp.id]: true }
  try {
    const url = await pinboardExportArtifacts.signedUrlForExport(exp, true)
    if (!url) return
    const base = (exp.title || "pinboard-export").replace(/[/\\?%*:|"<>]/g, "-")
    const link = document.createElement("a")
    link.href = url
    link.download = `${base}.zip`
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    downloadingExport.value = { ...downloadingExport.value, [exp.id]: false }
  }
}

async function downloadPowerPoint(ppt: HumanArtifactRow) {
  downloadingPowerPoint.value = { ...downloadingPowerPoint.value, [ppt.id]: true }
  try {
    const url = await powerPointArtifacts.signedUrlForPowerPoint(ppt, true)
    if (!url) return
    const base = (ppt.title || "powerpoint-presentation").replace(/[/\\?%*:|"<>]/g, "-")
    const link = document.createElement("a")
    link.href = url
    link.download = `${base}.pptx`
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    downloadingPowerPoint.value = { ...downloadingPowerPoint.value, [ppt.id]: false }
  }
}

function exportFailureMessage(exp: HumanArtifactRow): string | null {
  return artifactFailureMessage(exp)
}

function artifactFailureMessage(exp: HumanArtifactRow): string | null {
  const m = exp.metadata
  if (m && typeof m === "object" && !Array.isArray(m)) {
    const err =
      (m as Record<string, unknown>).export_error ??
      (m as Record<string, unknown>).generation_error
    if (typeof err === "string" && err.trim()) return err.trim()
  }
  return null
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ""
  const units = ["B", "KB", "MB", "GB"]
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}
</script>
