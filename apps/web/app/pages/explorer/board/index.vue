<template>
  <div class="min-h-screen bg-slate-100 px-8">
    <DeliverableHeader />

    <!-- Main Content -->
    <PinBoardView
      :pins="pinsList"
      :loading="pinsLoading"
      :error="pinsError"
      :enable-selection="true"
      :empty-all-message="$t('pins.boardEmpty')"
      :empty-category-message="$t('pins.boardEmptyCategory')"
      :artifact-count="artifactCountTotal"
    >
      <template #artifacts>
        <PinBoardArtifactsView
          :podcasts="podcastArtifactsList"
          :loading="podcastArtifactsLoading"
          :error="podcastArtifactsError"
          :pinboard-exports="pinboardExportsList"
          :pinboard-exports-loading="pinboardExportsLoading"
          :pinboard-exports-error="pinboardExportsError"
          :power-points="powerPointArtifactsList"
          :power-points-loading="powerPointArtifactsLoading"
          :power-points-error="powerPointArtifactsError"
          :generating-download="pinboardExportGenerating"
          :can-generate-download="canGeneratePinboardDownload"
          :generate-download-error="pinboardExportRequestError"
          @generate-download="handleGeneratePinboardDownload"
        />
      </template>
    </PinBoardView>

    <!-- Floating Action Bar -->
    <ActionBarBoard
      @open-chat="handleOpenChat"
      @open-insights="handleOpenInsights"
      @open-powerpoint="isPowerPointOpen = true"
      @open-podcast="isPodcastOpen = true"
      @open-video="isVideoOpen = true"
    />

    <!-- Chat Modal -->
    <!-- Fullscreen Modals -->
    <UModal
      v-model:open="isChatOpen"
      fullscreen
      title="Chat about the selected solutions"
      :ui="{
        content: 'min-h-0 flex max-h-dvh flex-col',
        body: 'flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6',
      }"
    >
      <template #body>
        <div class="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
          <ViewModeChat :hits="selectedSolutionsHits" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isInsightsOpen" fullscreen title="Top insights about the selected solutions">
      <template #body>
        <div class="max-w-5xl mx-auto">
          <ViewModeSummaries
            :hits="selectedSolutionsHits"
          />
        </div>
      </template>
    </UModal>

    <!-- Media Modals -->
    <UModal v-model:open="isVideoOpen" title="Video summary">
      <template #body>
        <div class="max-w-5xl mx-auto">
          <VideoPlayer embedded />
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton variant="soft" icon="i-lucide-share-2" @click="shareMedia('/media/summary_text_example.mp4', 'Video summary')">Share</UButton>
          <UButton icon="i-lucide-download" color="primary" @click="downloadMedia('/media/summary_text_example.mp4', 'video-summary.mp4')">Download</UButton>
        </div>
      </template>
    </UModal>

    <PodcastCreationWizard
      v-model:open="isPodcastOpen"
      :pins="pinsList"
      :project-id="projectsStore.currentProjectId"
      @generated="handlePodcastGenerated"
    />

    <PowerPointCreationWizard
      v-model:open="isPowerPointOpen"
      :pins="pinsList"
      :project-id="projectsStore.currentProjectId"
      @generated="handlePowerPointGenerated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePinsSupabase } from '~/composables/usePinsSupabase'
import { useProjectsStore } from '@/stores/projects'
import { usePinnedSelectionStore } from '@/stores/selection'
import PinBoardView from '~/components/explorer/wf/pin-board/PinBoardView.vue'
import PinBoardArtifactsView from '~/components/explorer/wf/pin-board/PinBoardArtifactsView.vue'
import PodcastCreationWizard from '~/components/explorer/wf/PodcastCreationWizard.vue'
import PowerPointCreationWizard from '~/components/explorer/wf/PowerPointCreationWizard.vue'

const pinsApi = usePinsSupabase()
const podcastArtifactsApi = usePodcastArtifacts()
const pinboardExportsApi = usePinboardExportArtifacts()
const powerPointArtifactsApi = usePowerPointArtifacts()
const projectsStore = useProjectsStore()
const selectionStore = usePinnedSelectionStore()
const { session, requireAuthForPersistence } = useAccess()

const pinsList = computed(() => pinsApi.pins.value)
const pinsLoading = computed(() => pinsApi.loading.value)
const pinsError = computed(() => pinsApi.error.value ?? null)
const podcastArtifactsList = computed(() =>
  podcastArtifactsApi.artifacts.value.map((artifact) => ({
    ...artifact,
    source_pin_ids: [...artifact.source_pin_ids],
  }))
)
const podcastArtifactsLoading = computed(() => podcastArtifactsApi.loading.value)
const podcastArtifactsError = computed(() => podcastArtifactsApi.error.value ?? null)

const powerPointArtifactsList = computed(() =>
  powerPointArtifactsApi.artifacts.value.map((artifact) => ({
    ...artifact,
    source_pin_ids: [...artifact.source_pin_ids],
  }))
)
const powerPointArtifactsLoading = computed(() => powerPointArtifactsApi.loading.value)
const powerPointArtifactsError = computed(() => powerPointArtifactsApi.error.value ?? null)

const pinboardExportsList = computed(() =>
  pinboardExportsApi.artifacts.value.map((artifact) => ({
    ...artifact,
    source_pin_ids: [...artifact.source_pin_ids],
  }))
)
const pinboardExportsLoading = computed(() => pinboardExportsApi.loading.value)
const pinboardExportsError = computed(() => pinboardExportsApi.error.value ?? null)

const artifactCountTotal = computed(
  () =>
    podcastArtifactsList.value.length +
    powerPointArtifactsList.value.length +
    pinboardExportsList.value.length
)

const pinboardExportGenerating = ref(false)
const pinboardExportRequestError = ref<string | null>(null)

const canGeneratePinboardDownload = computed(
  () =>
    Boolean(projectsStore.currentProjectId) &&
    !pinboardExportGenerating.value &&
    Boolean(session.value?.access_token)
)

const hasPendingPinboardExport = computed(() =>
  pinboardExportsList.value.some((a) => a.status === 'pending')
)

const { pause: pauseExportPoll, resume: resumeExportPoll } = useIntervalFn(
  () => {
    void pinboardExportsApi.fetchPinboardExports(projectsStore.currentProjectId)
  },
  3000,
  { immediate: false }
)

watch(hasPendingPinboardExport, (pending) => {
  if (pending) resumeExportPoll()
  else pauseExportPoll()
}, { immediate: true })

watch(
  () => projectsStore.currentProjectId,
  (id) => {
    void pinsApi.loadPinsForProject(id)
    void podcastArtifactsApi.fetchPodcastArtifacts(id)
    void powerPointArtifactsApi.fetchPowerPointArtifacts(id)
    void pinboardExportsApi.fetchPinboardExports(id)
  },
  { immediate: true }
)

async function handleGeneratePinboardDownload() {
  const projectId = projectsStore.currentProjectId
  if (!projectId) return
  if (!requireAuthForPersistence()) return
  const token = session.value?.access_token
  if (!token) {
    pinboardExportRequestError.value = "Sign in to generate a download."
    return
  }
  pinboardExportRequestError.value = null
  pinboardExportGenerating.value = true
  try {
    await $fetch('/api/pinboard-export', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { projectId },
    })
    await pinboardExportsApi.fetchPinboardExports(projectId)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    const msg = err.data?.message || err.message || 'Request failed'
    pinboardExportRequestError.value = msg
  } finally {
    pinboardExportGenerating.value = false
  }
}

// Page metadata
definePageMeta({
  title: "Climate Adaptation Explorer",
  description:
    "Explore climate adaptation papers and solutions with interactive filters and multiple view modes.",
  layout: 'explorer'
});
// Modal states
const isChatOpen = ref(false)
const isInsightsOpen = ref(false)
const isVideoOpen = ref(false)
const isPodcastOpen = ref(false)
const isPowerPointOpen = ref(false)

// Modal handlers
const handleOpenChat = () => {
  isChatOpen.value = true
}

const handleOpenInsights = () => {
  isInsightsOpen.value = true
}

const handlePodcastGenerated = () => {
  void podcastArtifactsApi.fetchPodcastArtifacts(projectsStore.currentProjectId)
}

const handlePowerPointGenerated = () => {
  void powerPointArtifactsApi.fetchPowerPointArtifacts(projectsStore.currentProjectId)
}

// Compute selected solution hits for modals
const selectedSolutionsHits = computed(() => {
  return selectionStore.selectedItems
    .filter((it: { type: string }) => it.type === 'result')
    .map((it: { id: string; data: unknown }) => ({ id: it.id, document: it.data }))
})

// Media helpers
const downloadMedia = (url: string, filename: string) => {
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    console.error('Failed to download media', e)
  }
}

const shareMedia = async (url: string, title: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = navigator
    if (nav && typeof nav.share === 'function') {
      await nav.share({ title, url })
      return
    }
    await navigator.clipboard?.writeText?.(location.origin + url)
    window.alert('Link copied to clipboard')
  } catch (e) {
    console.error('Failed to share media', e)
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
