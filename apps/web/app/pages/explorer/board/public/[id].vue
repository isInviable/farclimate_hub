<template>
  <div class="min-h-screen bg-white px-8">
    <PublicBoardHeader :project-name="publicProjectName" />

    <PinBoardView
      :pins="pinsList"
      :loading="pinsLoading"
      :error="pinsError"
      :enable-selection="false"
      :include-saved-searches="false"
      :empty-all-message="$t('pins.publicBoardEmpty')"
      :empty-category-message="$t('pins.boardEmptyCategory')"
    />

    <PublicActionBar @open-comments="isCommentsOpen = true" @cloned="onCloned" />

    <PublicCommentsModal v-model="isCommentsOpen" :project-id="route.params.id as string" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from '#imports'
import PinBoardView from '~/components/explorer/wf/pin-board/PinBoardView.vue'

const route = useRoute()
const router = useRouter()
const publicBoard = usePublicBoard()

const pinsList = computed(() => publicBoard.pins.value)
const pinsLoading = computed(() => publicBoard.loading.value)
const pinsError = computed(() => publicBoard.error.value ?? null)
const publicProjectName = computed(() => publicBoard.project.value?.name ?? 'Unnamed Project')

const isCommentsOpen = ref(false)

async function syncPublicBoard() {
  await publicBoard.loadPublicBoardByToken(route.params.id as string)
}

onMounted(() => {
  void syncPublicBoard()
})

watch(
  () => route.params.id as string | undefined,
  () => {
    void syncPublicBoard()
  }
)

const onCloned = (_newId: string) => {
  router.push('/explorer/board')
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
