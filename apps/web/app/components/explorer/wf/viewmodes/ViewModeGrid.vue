<template>
  <section class="relative bg-neutral-lightest">
    <UAlert
      v-if="isOverAiArticleLimit"
      color="warning"
      variant="subtle"
      class="mx-4 mt-4 rounded-none border border-neutral-darkest"
      :title="$t('viewModes.tooManyForAiTitle')"
    >
      {{
        $t("viewModes.tooManyForAiDescription", {
          max: GRID_AI_SUMMARY_MAX_ARTICLES,
          current: hitsForAiSummary.length,
          scope: anyCheckboxSelected
            ? $t("viewModes.tooManyForAiScopeSelected")
            : $t("viewModes.tooManyForAiScopeGrid"),
        })
      }}
    </UAlert>

    <div class="flex flex-col gap-3 px-4 py-3 border-y border-neutral-darkest">
      <ExplorerResultsToolbar
        v-model:page="page"
        :total-count="totalCount"
        :range-start="rangeStart"
        :range-end="rangeEnd"
        :page-size="pageSize"
        show-pagination
        show-bulk-select
        :all-on-page-selected="sel.isAllSelected(pageSelectionItems)"
        @bulk-toggle="toggleSelectAllOnPage"
      >
        <template #leading>
          <UFormField :label="$t('viewModes.showProperty')" class="w-64 min-w-48">
            <USelectMenu
              v-model="selectedProperty"
              :items="selectItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>
        </template>
      </ExplorerResultsToolbar>

      <div
        v-if="selectedProperty === 'custom'"
        class="flex flex-col gap-3 w-full max-w-2xl"
      >
        <UFormField :label="$t('viewModes.customCompareLabel')">
          <UTextarea
            v-model="customComparePrompt"
            :placeholder="$t('viewModes.customComparePlaceholder')"
            :rows="3"
            autoresize
            class="w-full"
            @keydown.meta.enter.prevent="submitCustomCompare"
            @keydown.ctrl.enter.prevent="submitCustomCompare"
          />
        </UFormField>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            color="primary"
            size="sm"
            :loading="isCustomCompareRunning"
            :disabled="!customComparePrompt.trim() || isOverAiArticleLimit"
            @click="submitCustomCompare"
          >
            {{ $t("viewModes.customCompareSubmit") }}
          </UButton>
          <p v-if="customComparePrompt.trim() && !customCompareHasSubmitted" class="text-xs text-neutral-dark">
            {{ $t("viewModes.customCompareSubmitHint") }}
          </p>
        </div>
      </div>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-l border-t border-neutral-darkest"
    >
      <ViewModeGridHitContext
        v-for="hit in pagedItems"
        :key="hit.id"
        :document="hit.document"
      >
        <div
          :class="[
            'border-r border-b border-neutral-darkest min-w-0 transition-colors flex flex-col min-h-[280px]',
            isSelected(hit.id)
              ? 'bg-neutral-300'
              : 'bg-neutral-100 hover:bg-neutral-200',
          ]"
        >
          <CapturableBlock
            :chrome="false"
            pin-kind="grid_compare_summary"
            :title="compareModeLabel"
            :payload="gridComparePayload(hit)"
            :preview="gridPinPreview(hit)"
            source-view="grid_compare"
            :show-ai-icon="selectedProperty !== 'subtitle'"
            :capture-enabled="true"
            class="block h-full"
          >
            <div class="h-full p-5 pr-10 flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <UCheckbox
                  :model-value="isSelected(hit.id)"
                  color="primary"
                  size="xs"
                  @update:model-value="() => toggleSelection(hit)"
                  @click.stop
                />
                <EditorialEyebrow
                  v-if="sectorOf(hit.document)"
                  color="primary"
                  size="2xs"
                >
                  {{ sectorOf(hit.document) }}
                </EditorialEyebrow>
              </div>

              <div
                class="cursor-pointer flex-1 flex flex-col gap-3"
                role="button"
                tabindex="0"
                @click="handleDocumentClick(hit.document)"
                @keydown.enter.prevent="handleDocumentClick(hit.document)"
              >
                <h3
                  class="font-display text-xl leading-snug text-neutral-darkest line-clamp-3"
                >
                  {{ hit.document.title }}
                </h3>

                <div class="text-sm text-neutral-darker flex-1">
                  <div
                    v-if="isLoading(hit.id)"
                    class="flex items-center justify-center py-8"
                  >
                    <UIcon
                      name="i-lucide-loader-2"
                      class="size-6 animate-spin text-primary-600"
                    />
                  </div>
                  <template v-else>
                    <div v-if="getSummary(hit.id)" class="space-y-2">
                      <p
                        class="text-sm text-neutral-darkest font-medium"
                        v-html="renderMarkdown(getSummary(hit.id)?.data ?? '')"
                      />
                      <div
                        class="prose prose-sm max-w-none text-neutral-darker"
                        v-html="renderMarkdown(getSummary(hit.id)?.summary ?? '')"
                      />
                    </div>
                    <p
                      v-else
                      class="whitespace-pre-line text-neutral-darker line-clamp-4"
                    >
                      {{ bodyFallback(hit) }}
                    </p>
                  </template>
                </div>

                <div
                  v-if="regionOf(hit.document) || yearOf(hit.document)"
                  class="flex items-center justify-between gap-2 border-t border-neutral-darkest/15 pt-2 mt-auto"
                >
                  <EditorialEyebrow
                    v-if="regionOf(hit.document)"
                    color="muted"
                    weight="normal"
                    class="truncate"
                  >
                    {{ regionOf(hit.document) }}
                  </EditorialEyebrow>
                  <EditorialEyebrow
                    v-if="yearOf(hit.document)"
                    color="default"
                    weight="bold"
                  >
                    {{ yearOf(hit.document) }}
                  </EditorialEyebrow>
                </div>
              </div>
            </div>
          </CapturableBlock>
        </div>
      </ViewModeGridHitContext>
    </div>
  </section>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it"
import { useI18n } from "vue-i18n"
import { useSearchSelectionStore } from "@/stores/searchSelection"
import CapturableBlock from "../../CapturableBlock.vue"
import ViewModeGridHitContext from "./ViewModeGridHitContext.vue"
import {
  buildCustomCompareContext,
  fallbackSnippetForProperty,
  GRID_AI_SUMMARY_MAX_ARTICLES,
  hashPrompt,
  resolvePropertySourceText,
  type GridCompareDocument,
  type GridCompareSelectValue,
} from "@/composables/gridCompareSource"
import { useExplorerResultsPaging } from "@/composables/useExplorerResultsPaging"
import type {
  SummarizePropertyBatchResponseBody,
  SummarizePropertyResponseBody,
} from "~/types/summarize"
import type { ArticleDetail, SearchResult } from "~/types/search"
import type { SearchSelectedItem } from "@/stores/searchSelection"

const md = new MarkdownIt()

type GridHitDocument = GridCompareDocument &
  Pick<
    SearchResult,
    | "document_uid"
    | "location"
    | "id"
    | "title"
    | "subtitle"
    | "summary"
    | "recipe_ingredients"
  >

interface SearchHit {
  id: string
  document: GridHitDocument
}

const props = withDefaults(
  defineProps<{
    results?: SearchHit[]
    totalCount?: number | null
    serverPage?: number
    serverPageSize?: number
  }>(),
  { results: () => [] }
)

const emit = defineEmits<{
  "document-selected": [doc: ArticleDetail]
  "page-change": [page: number]
}>()

const { t } = useI18n()
const sel = useSearchSelectionStore()

const selectedProperty = ref<GridCompareSelectValue>('subtitle')
const customComparePrompt = ref('')
/** True after user clicked Compare with the current prompt (hash); reset when prompt text changes. */
const customCompareSubmittedHash = ref<string | null>(null)
const isCustomCompareRunning = ref(false)
const summaryCache = ref(
  new Map<string, SummarizePropertyResponseBody["response"]>()
)
const loadingStates = ref(new Set<string>())

const customCompareHasSubmitted = computed(() => {
  const p = customComparePrompt.value.trim()
  if (!p) return false
  return customCompareSubmittedHash.value === hashPrompt(p)
})

/** If any row is checked, AI runs only on those; otherwise on all visible results. */
const anyCheckboxSelected = computed(() => sel.selected.length > 0)

const { page, pageSize, totalCount, pagedItems, rangeStart, rangeEnd } =
  useExplorerResultsPaging(toRef(props, 'results'), {
    pageSize: computed(() => props.serverPageSize ?? 12),
    totalCount: computed(() => props.totalCount),
    page: computed(() => props.serverPage),
    onPageChange: (nextPage) => emit("page-change", nextPage),
  })

const hitsForAiSummary = computed(() => {
  if (anyCheckboxSelected.value) {
    const idSet = new Set(sel.selected.map((i) => i.id))
    return pagedItems.value.filter((h) => idSet.has(h.id))
  }
  return pagedItems.value
})

const isOverAiArticleLimit = computed(
  () => hitsForAiSummary.value.length > GRID_AI_SUMMARY_MAX_ARTICLES
)

const pageSelectionItems = computed<SearchSelectedItem[]>(() =>
  pagedItems.value.map((h) => ({
    id: h.id,
    title: h.document?.title ?? '',
    document: h.document,
  }))
)

const selectItems = computed(() => [
  { label: t("viewModes.summary"), value: "subtitle" as const },
  { label: t("viewModes.costBenefit"), value: "cost_benefit" as const },
  { label: t("viewModes.implementationTime"), value: "implementation_time" as const },
  { label: t("viewModes.lifetime"), value: "lifetime" as const },
  { label: t("viewModes.stakeholderParticipation"), value: "stakeholder_participation" as const },
  { label: t("viewModes.successLimitations"), value: "success_limitations" as const },
  { label: t("viewModes.customCompare"), value: "custom" as const },
])

/** Second part of `source_title_snapshot` for grid pins (see `CapturableBlock` composed title). */
const compareModeLabel = computed(() => {
  const v = selectedProperty.value
  if (v === "custom") return t("viewModes.customCompare")
  if (v === "subtitle") return t("viewModes.summary")
  return selectItems.value.find((i) => i.value === v)?.label ?? v
})

const isSelected = (id: string) => sel.isSelected(id)

function toggleSelection(hit: SearchHit) {
  sel.toggle({
    id: hit.id,
    title: hit.document?.title || '',
    document: hit.document,
  })
}

function handleDocumentClick(doc: GridHitDocument) {
  emit("document-selected", doc as ArticleDetail)
}

/** Helpers for editorial card meta. Tolerate missing/heterogeneous fields. */
function sectorOf(doc: GridHitDocument): string {
  const s = (doc as unknown as { sectors?: string | string[] }).sectors
  if (!s) return ''
  return Array.isArray(s) ? (s[0] ?? '') : String(s)
}
function yearOf(doc: GridHitDocument): string {
  const y = (doc as unknown as { implementation_years?: { start_year?: number; end_year?: number } })
    .implementation_years
  const num = y?.start_year || y?.end_year
  return num ? String(num) : ''
}
function regionOf(doc: GridHitDocument): string {
  const geo = (doc as unknown as {
    geographic_characterisation?: { city?: string; countries?: string }
  }).geographic_characterisation
  return [geo?.city, geo?.countries].filter(Boolean).join(', ')
}

function renderMarkdown(text: string) {
  return md.render(text)
}

function cacheKeyForHit(hitId: string): string {
  if (selectedProperty.value === 'custom') {
    const p = customComparePrompt.value.trim()
    return `custom|${hitId}|${hashPrompt(p)}`
  }
  return `property|${hitId}|${selectedProperty.value}`
}

function isLoading(id: string) {
  return loadingStates.value.has(id)
}

function getSummary(id: string) {
  return summaryCache.value.get(cacheKeyForHit(id)) ?? null
}

function bodyFallback(hit: SearchHit): string {
  const doc = hit.document
  if (selectedProperty.value === "subtitle") {
    return (doc.subtitle ?? "").trim() || t("viewModes.sectionEmpty")
  }
  if (selectedProperty.value === "custom") {
    if (!customComparePrompt.value.trim()) {
      return t("viewModes.customCompareEmptyHint")
    }
    if (!customCompareHasSubmitted.value) {
      return t("viewModes.customCompareSubmitHint")
    }
    return fallbackSnippetForProperty(doc) || t("viewModes.sectionEmpty")
  }
  const raw = resolvePropertySourceText(doc, selectedProperty.value)
  if (raw) return raw
  return fallbackSnippetForProperty(doc) || t("viewModes.sectionEmpty")
}

function gridPinMarkdown(hit: SearchHit): string {
  const s = getSummary(hit.id)
  if (s) {
    const dataStr = String(s.data ?? "").trim()
    const sumStr = String(s.summary ?? "").trim()
    return [dataStr, sumStr].filter(Boolean).join("\n\n")
  }
  return bodyFallback(hit)
}

function gridComparePayload(hit: SearchHit): Record<string, unknown> {
  const mode: "property" | "custom" =
    selectedProperty.value === "custom" ? "custom" : "property"
  const p: Record<string, unknown> = {
    mode,
    sourceView: "grid_compare",
    articleTitle: (hit.document.title ?? "").trim(),
  }
  if (
    mode === "property" &&
    selectedProperty.value !== "subtitle" &&
    selectedProperty.value !== "custom"
  ) {
    p.property = selectedProperty.value
  }
  if (mode === "custom") {
    const prompt = customComparePrompt.value.trim()
    if (prompt) p.promptHash = hashPrompt(prompt)
  }
  const s = getSummary(hit.id)
  if (s) {
    p.data = s.data ?? ""
    p.summary = s.summary ?? ""
  }
  p.markdown = gridPinMarkdown(hit)
  return p
}

function gridPinPreview(hit: SearchHit): string {
  const text = gridPinMarkdown(hit)
  if (text.length > 800) return `${text.slice(0, 800)}…`
  return text
}

function sourceTextForSummarize(hit: SearchHit): string | null {
  if (selectedProperty.value === 'subtitle') return null
  if (selectedProperty.value === 'custom') {
    if (!customComparePrompt.value.trim()) return null
    return buildCustomCompareContext(hit.document)
  }
  const text = resolvePropertySourceText(hit.document, selectedProperty.value)
  return text.trim() ? text : null
}

/** One HTTP request; server runs parallel LLM calls per item. */
async function fetchSummariesBatch(hits: SearchHit[]) {
  if (selectedProperty.value === 'subtitle') return
  if (hits.length > GRID_AI_SUMMARY_MAX_ARTICLES) return

  const mode = selectedProperty.value === 'custom' ? 'custom' : 'property'
  if (mode === 'custom' && !customComparePrompt.value.trim()) return

  const items: { id: string; text: string; cacheId: string }[] = []
  const loadingIds: string[] = []

  for (const hit of hits) {
    const key = cacheKeyForHit(hit.id)
    if (summaryCache.value.has(key)) continue
    const text = sourceTextForSummarize(hit)
    if (!text) continue
    items.push({ id: hit.id, text, cacheId: key })
    loadingIds.push(hit.id)
  }

  if (items.length === 0) return

  for (const id of loadingIds) loadingStates.value.add(id)
  try {
    const userPrompt = customComparePrompt.value.trim()
    const property =
      selectedProperty.value === 'custom'
        ? undefined
        : selectedProperty.value

    const body =
      mode === 'custom'
        ? { mode: 'custom' as const, userPrompt, items }
        : { mode: 'property' as const, property: property!, items }

    const res = await $fetch<SummarizePropertyBatchResponseBody>(
      '/api/summarizePropertyBatch',
      { method: 'POST', body }
    )

    for (const r of res.results) {
      if (r.ok) summaryCache.value.set(r.cacheId, r.response)
      else console.error('[summarizePropertyBatch]', r.id, r.error)
    }
  } catch (error) {
    console.error('Error fetching summary batch:', error)
  } finally {
    for (const id of loadingIds) loadingStates.value.delete(id)
  }
}

function clearCustomSummaryCache() {
  for (const k of [...summaryCache.value.keys()]) {
    if (k.startsWith('custom|')) summaryCache.value.delete(k)
  }
}

/** Property / recipe modes only; custom compare uses `submitCustomCompare`. */
async function runPropertyGridSummaries() {
  if (selectedProperty.value === 'subtitle') return
  if (selectedProperty.value === 'custom') return
  if (isOverAiArticleLimit.value) return
  await fetchSummariesBatch(hitsForAiSummary.value)
}

async function submitCustomCompare() {
  const p = customComparePrompt.value.trim()
  if (!p) return
  if (isOverAiArticleLimit.value) return

  clearCustomSummaryCache()
  customCompareSubmittedHash.value = hashPrompt(p)

  isCustomCompareRunning.value = true
  try {
    await fetchSummariesBatch(hitsForAiSummary.value)
  } finally {
    isCustomCompareRunning.value = false
  }
}

watch(
  () =>
    [
      pagedItems.value,
      selectedProperty.value,
      sel.selected.length,
      sel.selected.map((s) => s.id).join(','),
    ] as const,
  () => {
    void runPropertyGridSummaries()
  },
  { immediate: true, deep: true }
)

watch(customComparePrompt, () => {
  customCompareSubmittedHash.value = null
  clearCustomSummaryCache()
})

function toggleSelectAllOnPage() {
  const items = pageSelectionItems.value
  if (items.length === 0) return
  if (sel.isAllSelected(items)) sel.removeByIds(items.map((i) => i.id))
  else sel.mergeAdd(items)
}
</script>
