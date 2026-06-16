<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div v-if="pending" class="container mx-auto px-4 py-8 space-y-4">
      <USkeleton class="h-10 w-2/3 max-w-xl" />
      <USkeleton class="h-48 w-full max-w-4xl" />
      <USkeleton class="h-64 w-full max-w-4xl" />
    </div>
    <ArticleViewAI
      v-else-if="article"
      :document="article"
      chrome="page"
      class="min-h-0 flex-1"
    />
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetail } from '@/types/search'
import ArticleViewAI from '@/components/explorer/ArticleViewAI.vue'
import { knowledgeApiLang } from '@/utils/knowledgeApiLang'

const route = useRoute()
const { locale, t } = useI18n()

const { data: article, error, pending } = await useFetch<ArticleDetail>(
  () => `/api/articles/${String(route.params.id ?? '')}`,
  {
    query: computed(() => ({
      lang: knowledgeApiLang(locale.value),
    })),
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
    showError({ statusCode: 404, statusMessage: t('article.errors.notFound') })
  }
})
definePageMeta({
  layout: 'article',
});


useHead({
  title: () => article.value?.title || 'Article',
})

if (error.value) {
  const code = statusFromError(error.value)
  if (code === 404 || code === 400) {
    throw createError({ statusCode: 404, statusMessage: t('article.errors.notFound') })
  }
  throw createError({
    statusCode: code === 502 ? 502 : 500,
    statusMessage: t('pins.drawer.loadError'),
  })
}
</script>
