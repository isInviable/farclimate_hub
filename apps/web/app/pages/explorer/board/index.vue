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
    >
      <template #sidebar-after-map>
        <PodcastArtifactsSection
          compact
          :podcasts="podcastArtifactsList"
          :loading="podcastArtifactsLoading"
          :error="podcastArtifactsError"
        />
      </template>
    </PinBoardView>

    <!-- Floating Action Bar -->
    <ActionBarBoard
      @open-chat="handleOpenChat"
      @open-insights="handleOpenInsights"
      @open-podcast="isPodcastOpen = true"
      @open-video="isVideoOpen = true"
    />

    <!-- Chat Modal -->
    <!-- Fullscreen Modals -->
    <UModal v-model:open="isChatOpen" fullscreen title="Chat about the selected solutions">
      <template #body>
        <div class="max-w-5xl mx-auto">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePinsSupabase } from '~/composables/usePinsSupabase'
import { useProjectsStore } from '@/stores/projects'
import { usePinnedSelectionStore } from '@/stores/selection'
import PinBoardView from '~/components/explorer/wf/pin-board/PinBoardView.vue'
import PodcastArtifactsSection from '~/components/explorer/wf/PodcastArtifactsSection.vue'
import PodcastCreationWizard from '~/components/explorer/wf/PodcastCreationWizard.vue'

const pinsApi = usePinsSupabase()
const podcastArtifactsApi = usePodcastArtifacts()
const projectsStore = useProjectsStore()
const selectionStore = usePinnedSelectionStore()

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

watch(
  () => projectsStore.currentProjectId,
  (id) => {
    void pinsApi.loadPinsForProject(id)
    void podcastArtifactsApi.fetchPodcastArtifacts(id)
  },
  { immediate: true }
)

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
