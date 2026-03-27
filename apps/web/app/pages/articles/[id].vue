<template>
  <div class="container mx-auto py-8 px-4">
    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-10 w-2/3 max-w-xl" />
      <USkeleton class="h-48 w-full max-w-4xl" />
      <USkeleton class="h-64 w-full max-w-4xl" />
    </div>
    <ArticleViewAI v-else-if="article" :document="article" :show-sidebar="false" />
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetail } from '@/types/search'
import ArticleViewAI from '@/components/explorer/ArticleViewAI.vue'

const route = useRoute()
const { locale } = useI18n()

const { data: article, error, pending } = await useFetch<ArticleDetail>(
  () => `/api/articles/${String(route.params.id ?? '')}`,
  {
    query: { lang: locale },
    watch: [locale, () => route.params.id],
  },
)

function statusFromError(e: unknown): number {
  if (!e || typeof e !== 'object') return 500
  const err = e as { statusCode?: number; status?: number }
  return Number(err.statusCode ?? err.status ?? 500)
}

watch(error, (e) => {
  if (!e || import.meta.server) return
  const code = statusFromError(e)
  if (code === 404 || code === 400) {
    showError({ statusCode: 404, statusMessage: 'Article not found' })
  }
})

useHead({
  title: () => article.value?.title || 'Article',
})

if (error.value) {
  const code = statusFromError(error.value)
  if (code === 404 || code === 400) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }
  throw createError({
    statusCode: code === 502 ? 502 : 500,
    statusMessage: 'Failed to load article',
  })
}
</script>
