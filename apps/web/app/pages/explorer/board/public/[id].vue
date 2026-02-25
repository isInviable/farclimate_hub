<template>
  <div class="min-h-screen bg-white px-8">
    <PublicBoardHeader />

    <WfBoardList
      :items="pinsStore.pinnedItems"
      :enable-selection="false"
      empty-all-message="The board owner hasn't pinned items yet."
      empty-category-message="Try selecting a different category."
    />

    <PublicActionBar @open-comments="isCommentsOpen = true" @cloned="onCloned" />

    <PublicCommentsModal v-model="isCommentsOpen" :project-id="route.params.id as string" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useProjectsStore } from '@/stores/projects'
import { usePinsStore } from '@/stores/pins'
import PublicBoardHeader from '@/components/wf/PublicBoardHeader.vue'
import PublicActionBar from '@/components/wf/PublicActionBar.vue'
import PublicCommentsModal from '@/components/wf/PublicCommentsModal.vue'
import WfBoardList from '@/components/wf/BoardList.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const pinsStore = usePinsStore()

const isCommentsOpen = ref(false)


const getTypeLabel = (t: string) => {
  if (t === 'result') return 'Solutions'
  if (t === 'contact') return 'Contacts'
  if (t === 'image') return 'Images'
  if (t === 'website') return 'Websites'
  return 'Other'
}

onMounted(() => {
  projectsStore.loadProjects()
  const id = route.params.id as string
  if (!id) return
  const project = projectsStore.getAllProjects().find(p => p.id === id)
  if (!project) return
  // switch current context to this project so header + pins reflect it
  projectsStore.switchToProject(id, { readOnly: true })
})

const onCloned = (newId: string) => {
  router.push('/deliverable1/board')
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


