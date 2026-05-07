<template>
  <UModal v-model:open="open" :title="$t('powerpoint.wizard.title')" fullscreen>
    <template #body>
      <div class="mx-auto max-w-5xl space-y-6">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            v-for="item in steps"
            :key="item.value"
            :color="step === item.value ? 'primary' : 'neutral'"
            :variant="step === item.value ? 'solid' : 'soft'"
          >
            {{ item.label }}
          </UBadge>
        </div>

        <UAlert
          v-if="visibleError"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="$t('powerpoint.wizard.errorTitle')"
          :description="visibleError"
        />

        <UAlert
          v-if="documentTextLoading"
          color="primary"
          variant="soft"
          icon="i-heroicons-arrow-path"
          :title="$t('powerpoint.wizard.loadingDocumentsTitle')"
          :description="$t('powerpoint.wizard.loadingDocumentsDescription')"
        />

        <section v-if="step === 'review'" class="space-y-5">
          <PowerPointSelectedSourcesReview
            :sources="sourcePreviews"
            :max="POWERPOINT_MAX_SELECTED_ITEMS"
            :max-chars="POWERPOINT_MAX_CONTEXT_CHARS"
            :words="totalWords"
            :chars="totalChars"
          />

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField :label="$t('powerpoint.wizard.titleLabel')" required>
              <UInput
                v-model="deckTitle"
                :placeholder="$t('powerpoint.wizard.titlePlaceholder')"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('powerpoint.wizard.slideCountLabel')">
              <UInput
                v-model.number="slideCount"
                type="number"
                min="1"
                :max="POWERPOINT_MAX_SLIDES"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('powerpoint.wizard.toneLabel')">
              <UInput
                v-model="tone"
                :placeholder="$t('powerpoint.wizard.tonePlaceholder')"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('powerpoint.wizard.languageLabel')">
              <UInput
                v-model="language"
                :placeholder="$t('powerpoint.wizard.languagePlaceholder')"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('powerpoint.wizard.audienceLabel')">
              <UInput
                v-model="audience"
                :placeholder="$t('powerpoint.wizard.audiencePlaceholder')"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('powerpoint.wizard.instructionsLabel')">
              <UTextarea
                v-model="extraInstructions"
                :placeholder="$t('powerpoint.wizard.instructionsPlaceholder')"
                :rows="5"
                autoresize
                class="w-full"
              />
            </UFormField>
          </div>
        </section>

        <section v-else-if="step === 'structure'" class="space-y-5">
          <UCard>
            <template #header>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ $t("powerpoint.wizard.structureTitle") }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ $t("powerpoint.wizard.structureDescription") }}
                </p>
              </div>
            </template>

            <div v-if="generatingStructure" class="flex items-center gap-3 py-10 text-gray-600">
              <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
              <span>{{ $t("powerpoint.wizard.generatingStructure") }}</span>
            </div>
            <PowerPointStructurePreview
              v-else-if="presentation"
              :presentation="presentation"
            />
          </UCard>

          <UFormField
            v-if="presentation"
            :label="$t('powerpoint.wizard.rawStructureLabel')"
          >
            <UTextarea
              v-model="structureJson"
              :rows="14"
              autoresize
              class="w-full font-mono text-xs"
            />
          </UFormField>
        </section>

        <section v-else class="space-y-5">
          <UAlert
            color="success"
            variant="soft"
            icon="i-heroicons-check-circle"
            :title="$t('powerpoint.wizard.completeTitle')"
            :description="$t('powerpoint.wizard.completeDescription')"
          />
          <UCard>
            <p class="text-sm text-gray-600">
              {{ $t("powerpoint.wizard.completeHelp") }}
            </p>
          </UCard>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          v-if="step !== 'complete'"
          type="button"
          variant="ghost"
          color="neutral"
          :disabled="busy"
          @click="open = false"
        >
          {{ $t("powerpoint.wizard.cancel") }}
        </UButton>
        <UButton
          v-if="step === 'structure'"
          type="button"
          variant="outline"
          color="neutral"
          :disabled="busy"
          @click="step = 'review'"
        >
          {{ $t("powerpoint.wizard.back") }}
        </UButton>
        <UButton
          v-if="step === 'review'"
          type="button"
          color="primary"
          icon="i-heroicons-sparkles"
          :loading="generatingStructure"
          @click="generateStructure"
        >
          {{ $t("powerpoint.wizard.createStructure") }}
        </UButton>
        <UButton
          v-if="step === 'structure'"
          type="button"
          color="primary"
          icon="i-heroicons-document-arrow-down"
          :loading="generatingDeck"
          :disabled="generatingStructure || !presentation"
          @click="generatePowerPoint"
        >
          {{ $t("powerpoint.wizard.generatePowerPoint") }}
        </UButton>
        <UButton
          v-if="step === 'complete'"
          type="button"
          color="primary"
          @click="open = false"
        >
          {{ $t("powerpoint.wizard.done") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import PowerPointSelectedSourcesReview from "./powerpoint/PowerPointSelectedSourcesReview.vue"
import PowerPointStructurePreview from "./powerpoint/PowerPointStructurePreview.vue"
import type {
  PresentationStructure,
  PresentationStructureResponse,
} from "~/types/presentationGeneration"
import type { HumanPinRow } from "~/types/pins"
import {
  POWERPOINT_MAX_CONTEXT_CHARS,
  POWERPOINT_MAX_SELECTED_ITEMS,
  POWERPOINT_MAX_SLIDES,
  selectedPowerPointSources,
  totalPowerPointTextLength,
  totalPowerPointWords,
  validatePowerPointSelection,
} from "~/utils/powerPointSelection"
import {
  buildPowerPointDeck,
  powerPointDeckToBlob,
  type PowerPointImageAsset,
} from "~/utils/powerPointDeck"
import { usePinnedSelectionStore } from "@/stores/selection"

const props = defineProps<{
  pins: HumanPinRow[]
  projectId: string | null
}>()

const emit = defineEmits<{
  generated: []
}>()

const open = defineModel<boolean>("open", { default: false })

type WizardStep = "review" | "structure" | "complete"

const { t, locale } = useI18n()
const selectionStore = usePinnedSelectionStore()
const { session, requireAuthForPersistence } = useAccess()
const powerPointArtifacts = usePowerPointArtifacts()

const step = ref<WizardStep>("review")
const deckTitle = ref("")
const tone = ref("")
const language = ref("")
const audience = ref("")
const extraInstructions = ref("")
const slideCount = ref(6)
const presentation = ref<PresentationStructure | null>(null)
const structureJson = ref("")
const generatedModel = ref<string | null>(null)
const actionError = ref<string | null>(null)
const generatingStructure = ref(false)
const generatingDeck = ref(false)
const documentTextByUid = ref<Record<string, string>>({})
const loadingDocumentUids = ref<Set<string>>(new Set())

const selectedIds = computed(() => selectionStore.selectedItems.map((item) => item.id))
const selectedDocumentUids = computed(() =>
  props.pins
    .filter(
      (pin) =>
        selectedIds.value.includes(pin.id) &&
        pin.body_kind === "document" &&
        !!pin.source_document_uid
    )
    .map((pin) => pin.source_document_uid as string)
)
const documentTextLoading = computed(() => loadingDocumentUids.value.size > 0)
const sourcePreviews = computed(() =>
  selectedPowerPointSources(props.pins, selectedIds.value, documentTextByUid.value)
)
const totalChars = computed(() => totalPowerPointTextLength(sourcePreviews.value))
const totalWords = computed(() => totalPowerPointWords(sourcePreviews.value))
const busy = computed(() => generatingStructure.value || generatingDeck.value)

const steps = computed(() => [
  { value: "review", label: t("powerpoint.wizard.stepReview") },
  { value: "structure", label: t("powerpoint.wizard.stepStructure") },
  { value: "complete", label: t("powerpoint.wizard.stepComplete") },
])

const selectionValidationMessage = computed(() => {
  if (documentTextLoading.value) return null
  const validation = validatePowerPointSelection(sourcePreviews.value)
  if (validation.ok) return null
  switch (validation.code) {
    case "empty":
      return t("powerpoint.wizard.validation.empty")
    case "too_many_items":
      return t("powerpoint.wizard.validation.tooManyItems", validation.params ?? {})
    case "empty_text":
      return t("powerpoint.wizard.validation.emptyText")
    case "too_much_text":
      return t("powerpoint.wizard.validation.tooMuchText", validation.params ?? {})
    default:
      return t("powerpoint.wizard.validation.generic")
  }
})

const visibleError = computed(() => actionError.value || selectionValidationMessage.value)

watch(open, (isOpen) => {
  if (isOpen) resetWizard()
})

watch(
  [open, selectedDocumentUids, () => locale.value],
  ([isOpen]) => {
    if (!isOpen) return
    void loadSelectedDocumentTexts()
  },
  { immediate: true }
)

async function generateStructure() {
  actionError.value = null
  await loadSelectedDocumentTexts()
  const validation = validatePowerPointSelection(sourcePreviews.value)
  if (!validation.ok || !requireAuthForPersistence() || !session.value?.access_token) return

  generatingStructure.value = true
  step.value = "structure"
  presentation.value = null
  structureJson.value = ""
  try {
    const response = await $fetch<PresentationStructureResponse>("/api/presentation-structure", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.value.access_token}`,
      },
      body: {
        items: sourcePreviews.value.map((item) => item.source),
        instructions: {
          tone: tone.value,
          language: language.value,
          audience: audience.value,
          slideCount: slideCount.value,
          extra: extraInstructions.value,
        },
      },
    })
    presentation.value = response.presentation
    generatedModel.value = response.model
    structureJson.value = JSON.stringify(response.presentation, null, 2)
  } catch (e) {
    actionError.value = errorMessage(e, t("powerpoint.wizard.structureFailed"))
  } finally {
    generatingStructure.value = false
  }
}

async function generatePowerPoint() {
  actionError.value = null
  if (!props.projectId) {
    actionError.value = t("powerpoint.wizard.validation.missingProject")
    return
  }
  if (!requireAuthForPersistence()) return

  const reviewed = parseReviewedPresentation()
  if (!reviewed) return

  generatingDeck.value = true
  try {
    const deck = buildPowerPointDeck(reviewed, {
      images: imageAssetsBySourceId(),
    })
    const pptx = await powerPointDeckToBlob(deck)
    await powerPointArtifacts.createPowerPointArtifact({
      projectId: props.projectId,
      title: deckTitle.value.trim() || reviewed.title || t("powerpoint.wizard.defaultTitle"),
      presentation: reviewed,
      pptx,
      sourcePinIds: sourcePreviews.value.map((item) => item.source.id),
      metadata: {
        sourceCount: sourcePreviews.value.length,
        instructions: {
          tone: tone.value.trim() || null,
          language: language.value.trim() || null,
          audience: audience.value.trim() || null,
          slideCount: slideCount.value,
          extra: extraInstructions.value.trim() || null,
        },
        model: generatedModel.value,
      },
    })
    emit("generated")
    step.value = "complete"
  } catch (e) {
    actionError.value = errorMessage(e, t("powerpoint.wizard.generationFailed"))
  } finally {
    generatingDeck.value = false
  }
}

function parseReviewedPresentation(): PresentationStructure | null {
  try {
    const parsed = JSON.parse(structureJson.value) as PresentationStructure
    if (!parsed || !Array.isArray(parsed.slides) || !parsed.title) {
      throw new Error(t("powerpoint.wizard.invalidStructure"))
    }
    presentation.value = parsed
    return parsed
  } catch (e) {
    actionError.value = errorMessage(e, t("powerpoint.wizard.invalidStructure"))
    return null
  }
}

function imageAssetsBySourceId(): Record<string, PowerPointImageAsset> {
  return Object.fromEntries(
    sourcePreviews.value
      .filter((item) => item.imageSrc)
      .map((item) => [
        item.source.id,
        {
          sourceId: item.source.id,
          src: item.imageSrc ?? undefined,
          alt: String(item.source.data?.alt ?? ""),
          caption: String(item.source.data?.caption ?? item.title),
        },
      ])
  )
}

function resetWizard() {
  step.value = "review"
  actionError.value = null
  presentation.value = null
  structureJson.value = ""
  generatedModel.value = null
  deckTitle.value = t("powerpoint.wizard.defaultTitle")
  tone.value = ""
  language.value = locale.value === "es" ? "Spanish" : "English"
  audience.value = ""
  extraInstructions.value = ""
  slideCount.value = 6
}

async function loadSelectedDocumentTexts() {
  const lang = locale.value === "es" ? "es" : "en"
  const missingUids = [...new Set(selectedDocumentUids.value)].filter(
    (uid) => !documentTextByUid.value[uid] && !loadingDocumentUids.value.has(uid)
  )
  if (missingUids.length === 0) return

  loadingDocumentUids.value = new Set([...loadingDocumentUids.value, ...missingUids])
  try {
    await Promise.all(
      missingUids.map(async (uid) => {
        const response = await $fetch<{ document?: { fulltext?: string | null } }>(
          "/api/document-by-uid",
          { query: { uid, lang } }
        )
        const text = response.document?.fulltext?.trim() ?? ""
        if (text) {
          documentTextByUid.value = {
            ...documentTextByUid.value,
            [uid]: text,
          }
        }
      })
    )
  } catch (e) {
    actionError.value = errorMessage(e, t("powerpoint.wizard.documentTextFailed"))
  } finally {
    const next = new Set(loadingDocumentUids.value)
    for (const uid of missingUids) next.delete(uid)
    loadingDocumentUids.value = next
  }
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const row = error as Record<string, unknown>
    if (typeof row.statusMessage === "string") return row.statusMessage
    if (typeof row.message === "string") return row.message
    const data = row.data as Record<string, unknown> | undefined
    if (typeof data?.message === "string") return data.message
  }
  return fallback
}
</script>
