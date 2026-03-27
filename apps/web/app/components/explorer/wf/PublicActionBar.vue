<template>
  <ActionBarBase>
    <template #left>
      <div class="flex items-center gap-3">
        <uButton
          variant="outline"
          color="primary"
          size="sm"
          class="rounded-full"
          disabled
        >
          View only
        </uButton>
      </div>
    </template>

    <UButton variant="outline" @click="handleClone">
      <Icon name="mdi:content-copy" class="mr-2 h-4 w-4" />
      Clone to my projects
    </UButton>
    <UButton variant="outline" @click="$emit('open-comments')">
      <Icon name="mdi:comment-plus-outline" class="mr-2 h-4 w-4" />
      Add comment
    </UButton>
    <UButton variant="outline" :disabled="true">
      <Icon name="mdi:download" class="mr-2 h-4 w-4" />
      Download
    </UButton>
  </ActionBarBase>
</template>

<script setup lang="ts">
import ActionBarBase from './ActionBarBase.vue'
import { useProjectsStore } from '@/stores/projects'

const emit = defineEmits<{ (e: 'cloned', projectId: string): void; (e: 'open-comments'): void }>()

const projectsStore = useProjectsStore()

const handleClone = async () => {
  if (!projectsStore.currentProject) return
  const sourceName = projectsStore.currentProject.name || 'Unnamed Project'
  const newProject = await projectsStore.createProject(`Copy of ${sourceName}`)
  if (newProject) {
    emit('cloned', newProject.id)
  }
}
</script>


