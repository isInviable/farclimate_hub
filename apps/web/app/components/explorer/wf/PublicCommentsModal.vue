<template>
  <UModal v-model:open="isOpen" :title="$t('publicBoard.comments.title')" :fullscreen="false">
    <template #body>
      <div class="space-y-4">
        <div v-if="comments.length === 0" class="text-sm text-gray-500">{{ $t('publicBoard.comments.empty') }}</div>
        <div v-else class="space-y-3 max-h-80 overflow-auto pr-2">
          <div v-for="c in comments" :key="c.id" class="bg-white rounded border p-3">
            <div class="text-xs text-gray-400">{{ formatDate(c.createdAt) }}</div>
            <div class="text-sm whitespace-pre-wrap">{{ c.text }}</div>
          </div>
        </div>
        <div class="border-t pt-3">
          <UTextarea v-model="draft" :placeholder="$t('publicBoard.comments.placeholder')" :rows="3" />
          <div class="flex justify-end mt-2">
            <UButton variant="solid" color="primary" :disabled="!draft.trim()" @click="addComment">{{ $t('publicBoard.comments.submit') }}</UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{ projectId: string; modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

type CommentItem = { id: string; text: string; createdAt: number }

const isOpen = ref(props.modelValue)
watch(() => props.modelValue, v => isOpen.value = v)
watch(isOpen, v => emit('update:modelValue', v))

const draft = ref('')
const comments = ref<CommentItem[]>([])

const storageKey = () => `farclimate-public-comments:${props.projectId}`

const load = () => {
  if (!process.client) return
  try {
    const raw = localStorage.getItem(storageKey())
    comments.value = raw ? JSON.parse(raw) : []
  } catch (e) {
    comments.value = []
  }
}

const save = () => {
  if (!process.client) return
  localStorage.setItem(storageKey(), JSON.stringify(comments.value))
}

const addComment = () => {
  const text = draft.value.trim()
  if (!text) return
  const item: CommentItem = { id: Math.random().toString(36).slice(2), text, createdAt: Date.now() }
  comments.value.unshift(item)
  draft.value = ''
  save()
}

const formatDate = (ts: number) => new Date(ts).toLocaleString()

onMounted(load)
</script>


