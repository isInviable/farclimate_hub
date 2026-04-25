<template>
  <slot />
</template>

<script setup lang="ts">
import { PinArticleContextKey, type PinArticleContext } from "../../pinContext"
import type { SearchResult } from "~/types/search"

const props = defineProps<{
  document: Pick<SearchResult, "document_uid" | "location" | "title">
}>()

const documentUid = computed(() => props.document.document_uid ?? null)

const title = computed(() => {
  const t = props.document.title
  if (t == null || String(t).trim() === "") return null
  return String(t).trim()
})

const location = computed((): [number, number] | null => {
  const loc = props.document.location
  if (!Array.isArray(loc) || loc.length !== 2) return null
  const [a, b] = loc
  if (typeof a !== "number" || typeof b !== "number") return null
  return [a, b]
})

const ctx: PinArticleContext = {
  documentUid,
  title,
  location,
}
provide(PinArticleContextKey, ctx)
</script>
