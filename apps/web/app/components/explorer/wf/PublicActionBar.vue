<template>
  <ActionBarBase variant="accent">
    <template #left>
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em] text-neutral-lightest/80">
        {{ $t('publicBoard.actions.viewOnly') }}
      </span>
    </template>

    <button
      type="button"
      class="flex items-center gap-2 px-4 h-11 text-neutral-lightest hover:bg-neutral-lightest/10 transition-colors"
      @click="handleClone"
    >
      <Icon name="mdi:content-copy" class="h-4 w-4 text-primary-400" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em]">
        {{ $t('publicBoard.actions.cloneToProjects') }}
      </span>
    </button>
    <button
      type="button"
      class="flex items-center gap-2 px-4 h-11 text-neutral-lightest hover:bg-neutral-lightest/10 transition-colors"
      @click="$emit('open-comments')"
    >
      <Icon name="mdi:comment-plus-outline" class="h-4 w-4 text-primary-400" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em]">
        {{ $t('publicBoard.actions.addComment') }}
      </span>
    </button>
    <button
      type="button"
      class="flex items-center gap-2 px-4 h-11 text-neutral-lightest/50 cursor-not-allowed"
      disabled
    >
      <Icon name="mdi:download" class="h-4 w-4" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em]">
        {{ $t('publicBoard.actions.download') }}
      </span>
    </button>
  </ActionBarBase>
</template>

<script setup lang="ts">
import ActionBarBase from './ActionBarBase.vue'
import { useProjectsStore } from '@/stores/projects'

const emit = defineEmits<{ (e: 'cloned', projectId: string): void; (e: 'open-comments'): void }>()

const projectsStore = useProjectsStore()
const { t } = useI18n()

const handleClone = async () => {
  if (!projectsStore.currentProject) return
  const sourceName = projectsStore.currentProject.name || t('projects.unnamed')
  const newProject = await projectsStore.createProject(
    t('boardActions.cloneCopyOf', { name: sourceName }),
  )
  if (newProject) {
    emit('cloned', newProject.id)
  }
}
</script>


