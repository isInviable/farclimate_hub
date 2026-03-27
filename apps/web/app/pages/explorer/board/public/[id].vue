<template>
  <div class="min-h-screen bg-white px-8">
    <PublicBoardHeader />

    <BoardList
      :items="boardItems"
      :enable-selection="false"
      :empty-all-message="$t('pins.publicBoardEmpty')"
      :empty-category-message="$t('pins.boardEmptyCategory')"
    />

    <PublicActionBar @open-comments="isCommentsOpen = true" @cloned="onCloned" />

    <PublicCommentsModal v-model="isCommentsOpen" :project-id="route.params.id as string" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useProjectsStore } from '@/stores/projects'
import { usePinsSupabase } from '~/composables/usePinsSupabase'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const pinsApi = usePinsSupabase()

const boardItems = computed(() => pinsApi.boardItems.value)

const isCommentsOpen = ref(false)

async function syncPublicBoard() {
  if (projectsStore.projects.length === 0) await projectsStore.initialize()
  const id = route.params.id as string
  if (!id) return
  if (projectsStore.getAllProjects().some((p) => p.id === id)) {
    projectsStore.switchToProject(id, { readOnly: true })
  }
  await pinsApi.loadPinsForProject(id)
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
