<template>
  <UModal v-model:open="open" :title="$t('podcast.wizard.title')" fullscreen>
    <template #body>
      <div class="mx-auto max-w-4xl space-y-6">
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
          :title="$t('podcast.wizard.errorTitle')"
          :description="visibleError"
        />

        <UAlert
          v-if="documentTextLoading"
          color="primary"
          variant="soft"
          icon="i-heroicons-arrow-path"
          :title="$t('podcast.wizard.loadingDocumentsTitle')"
          :description="$t('podcast.wizard.loadingDocumentsDescription')"
        />

        <UAlert
          v-if="usingSummaries && !contextTooLarge"
          color="warning"
          variant="soft"
          icon="i-heroicons-information-circle"
          :title="$t('podcast.wizard.summariesNoticeTitle')"
          :description="$t('podcast.wizard.summariesNoticeDescription')"
        />

        <section v-if="step === 'review'" class="space-y-5">
          <UCard>
            <template #header>
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ $t("podcast.wizard.selectedItemsTitle") }}
                  </h3>
                  <p class="text-sm text-gray-500">
                    {{
                      $t("podcast.wizard.selectedItemsSummary", {
                        count: sourcePreviews.length,
                        max: PODCAST_MAX_SELECTED_ITEMS,
                        words: totalWords,
                      })
                    }}
                  </p>
                </div>
                <UBadge :color="contextTooLarge ? 'error' : 'neutral'" variant="soft">
                  {{ $t("podcast.wizard.contextTokens", { tokens: estimatedTokens }) }}
                </UBadge>
              </div>
            </template>

            <div v-if="sourcePreviews.length === 0" class="text-sm text-gray-500">
              {{ $t("podcast.wizard.noSelection") }}
            </div>
            <div v-else class="divide-y divide-gray-100">
              <article
                v-for="item in sourcePreviews"
                :key="item.source.id"
                class="py-3 first:pt-0 last:pb-0"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h4 class="font-medium text-gray-900">
                    {{ item.title }}
                  </h4>
                  <span class="text-xs text-gray-500">
                    {{
                      $t("podcast.wizard.itemStats", {
                        words: item.wordCount,
                        chars: item.textLength,
                      })
                    }}
                  </span>
                </div>
                <p class="mt-1 line-clamp-2 text-sm text-gray-600">
                  {{ item.source.text || $t("podcast.wizard.noTextForItem") }}
                </p>
              </article>
            </div>
          </UCard>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField :label="$t('podcast.wizard.titleLabel')" required>
              <UInput
                v-model="podcastTitle"
                :placeholder="$t('podcast.wizard.titlePlaceholder')"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('podcast.wizard.instructionsLabel')">
              <UTextarea
                v-model="extraInstructions"
                :placeholder="$t('podcast.wizard.instructionsPlaceholder')"
                :rows="5"
                autoresize
                class="w-full"
              />
            </UFormField>
          </div>
        </section>

        <section v-else-if="step === 'script'" class="space-y-5">
          <UCard>
            <template #header>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ $t("podcast.wizard.generatingTitle") }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ $t("podcast.wizard.generatingDescription") }}
                </p>
              </div>
            </template>

            <div v-if="summarizing" class="flex items-center gap-3 py-10 text-gray-600">
              <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
              <span>{{ $t("podcast.wizard.summarizing") }}</span>
            </div>
            <UFormField v-else :label="$t('podcast.wizard.scriptLabel')">
              <UTextarea
                v-model="script"
                :rows="16"
                autoresize
                class="w-full font-mono text-sm"
              />
            </UFormField>
          </UCard>
        </section>

        <section v-else class="space-y-5">
          <UAlert
            color="success"
            variant="soft"
            icon="i-heroicons-check-circle"
            :title="$t('podcast.wizard.completeTitle')"
            :description="$t('podcast.wizard.completeDescription')"
          />
          <UCard>
            <p class="text-sm text-gray-600">
              {{ $t("podcast.wizard.completeHelp") }}
            </p>
            <UButton
              class="mt-3 px-0"
              variant="link"
              color="primary"
              icon="i-heroicons-folder-open"
              @click="goToArtifacts"
            >
              {{ $t("podcast.wizard.openArtifacts") }}
            </UButton>
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
          {{ $t("podcast.wizard.cancel") }}
        </UButton>
        <UButton
          v-if="step === 'script'"
          type="button"
          variant="outline"
          color="neutral"
          :disabled="busy"
          @click="step = 'review'"
        >
          {{ $t("podcast.wizard.back") }}
        </UButton>
        <UButton
          v-if="step === 'review'"
          type="button"
          color="primary"
          icon="i-heroicons-sparkles"
          :loading="summarizing"
          @click="generateSummary"
        >
          {{ $t("podcast.wizard.createScript") }}
        </UButton>
        <UButton
          v-if="step === 'script'"
          type="button"
          color="primary"
          icon="i-heroicons-speaker-wave"
          :loading="generatingAudio"
          :disabled="summarizing || !script.trim()"
          @click="generatePodcast"
        >
          {{ $t("podcast.wizard.generatePodcast") }}
        </UButton>
        <UButton
          v-if="step === 'complete'"
          type="button"
          color="primary"
          @click="open = false"
        >
          {{ $t("podcast.wizard.done") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type {
  PodcastSummarizeResponse,
  PodcastTextToSpeechResponse,
} from "~/types/podcastGeneration";
import type { HumanPinRow } from "~/types/pins";
import {
  PODCAST_MAX_SELECTED_ITEMS,
  PODCAST_MAX_TTS_INPUT_BYTES,
  selectedPodcastSources,
  totalPodcastWords,
  validatePodcastSelection,
  type ResolvedDocumentContext,
} from "~/utils/podcastSelection";
import { assembleArtifactContext } from "~/utils/artifactSourceContext";
import { usePinnedSelectionStore } from "@/stores/selection";
import { knowledgeApiLang } from "@/utils/knowledgeApiLang";

const props = defineProps<{
  pins: HumanPinRow[];
  projectId: string | null;
}>();

const emit = defineEmits<{
  (e: "generated"): void;
  (e: "openArtifacts"): void;
}>();

const open = defineModel<boolean>("open", { default: false });

type WizardStep = "review" | "script" | "complete";

const { t, locale } = useI18n();
const selectionStore = usePinnedSelectionStore();
const { session, requireAuthForPersistence } = useAccess();

const step = ref<WizardStep>("review");
const podcastTitle = ref("");
const extraInstructions = ref("");
const script = ref("");
const actionError = ref<string | null>(null);
const summarizing = ref(false);
const generatingAudio = ref(false);
const documentContextByUid = ref<Record<string, ResolvedDocumentContext>>({});
const loadingDocumentUids = ref<Set<string>>(new Set());

const selectedIds = computed(() => selectionStore.selectedItems.map((item) => item.id));
const selectedDocumentUids = computed(() =>
  props.pins
    .filter(
      (pin) =>
        selectedIds.value.includes(pin.id) &&
        !!pin.source_document_uid
    )
    .map((pin) => pin.source_document_uid as string)
);
const documentTextLoading = computed(() => loadingDocumentUids.value.size > 0);
const sourcePreviews = computed(() =>
  selectedPodcastSources(props.pins, selectedIds.value, documentContextByUid.value)
);
const totalWords = computed(() => totalPodcastWords(sourcePreviews.value));
const assembledContext = computed(() =>
  assembleArtifactContext(
    sourcePreviews.value.map((item) => ({
      id: item.source.id,
      title: item.source.title ?? "",
      bodyKind: item.source.bodyKind ?? "unknown",
      sourceDocumentUid: item.source.sourceDocumentUid ?? null,
      userNote: item.source.userNote ?? "",
      text: item.source.text ?? "",
      articleFullText: item.source.articleFullText ?? "",
      articleSummary: item.source.articleSummary ?? "",
      articleSubtitle: item.source.articleSubtitle ?? "",
      articleMetadata: item.source.articleMetadata ?? {},
    }))
  )
);
const estimatedTokens = computed(() => assembledContext.value.idealEstimatedTokens);
const usingSummaries = computed(() => assembledContext.value.usedSummaries);
const contextTooLarge = computed(() => assembledContext.value.tooLarge);
const busy = computed(() => summarizing.value || generatingAudio.value);

const steps = computed(() => [
  { value: "review", label: t("podcast.wizard.stepReview") },
  { value: "script", label: t("podcast.wizard.stepScript") },
  { value: "complete", label: t("podcast.wizard.stepComplete") },
]);

const selectionValidationMessage = computed(() => {
  if (documentTextLoading.value) return null;
  if (contextTooLarge.value) return t("podcast.wizard.validation.contextTooLarge");
  const validation = validatePodcastSelection(sourcePreviews.value);
  if (validation.ok) return null;
  switch (validation.code) {
    case "empty":
      return t("podcast.wizard.validation.empty");
    case "too_many_items":
      return t("podcast.wizard.validation.tooManyItems", validation.params ?? {});
    case "empty_text":
      return t("podcast.wizard.validation.emptyText");
    case "too_much_text":
      return t("podcast.wizard.validation.tooMuchText", validation.params ?? {});
    default:
      return t("podcast.wizard.validation.generic");
  }
});

const scriptValidationMessage = computed(() => {
  const bytes = utf8ByteLength(script.value.trim());
  if (bytes <= PODCAST_MAX_TTS_INPUT_BYTES) return null;
  return t("podcast.wizard.validation.scriptTooLong", {
    max: PODCAST_MAX_TTS_INPUT_BYTES,
    current: bytes,
  });
});

const visibleError = computed(
  () => actionError.value || selectionValidationMessage.value || scriptValidationMessage.value
);

watch(open, (isOpen) => {
  if (isOpen) resetWizard();
});

watch(
  [open, selectedDocumentUids, () => locale.value],
  ([isOpen]) => {
    if (!isOpen) return;
    void loadSelectedDocumentTexts();
  },
  { immediate: true }
);

async function generateSummary() {
  actionError.value = null;
  await loadSelectedDocumentTexts();
  const validation = validatePodcastSelection(sourcePreviews.value);
  if (!validation.ok || !requireAuthForPersistence() || !session.value?.access_token) return;

  summarizing.value = true;
  step.value = "script";
  script.value = "";
  try {
    const response = await $fetch<PodcastSummarizeResponse>("/api/podcast-summarize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.value.access_token}`,
      },
      body: {
        items: sourcePreviews.value.map((item) => item.source),
        extraInstructions: extraInstructions.value,
      },
    });
    script.value = response.script;
  } catch (e) {
    actionError.value = errorMessage(e, t("podcast.wizard.summaryFailed"));
  } finally {
    summarizing.value = false;
  }
}

async function generatePodcast() {
  actionError.value = null;
  if (!props.projectId) {
    actionError.value = t("podcast.wizard.validation.missingProject");
    return;
  }
  if (scriptValidationMessage.value || !requireAuthForPersistence() || !session.value?.access_token) {
    return;
  }

  generatingAudio.value = true;
  try {
    await $fetch<PodcastTextToSpeechResponse>("/api/podcast-text-to-speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.value.access_token}`,
      },
      body: {
        projectId: props.projectId,
        script: script.value,
        title: podcastTitle.value.trim() || t("podcast.wizard.defaultTitle"),
        sourcePinIds: sourcePreviews.value.map((item) => item.source.id),
        metadata: {
          sourceCount: sourcePreviews.value.length,
          extraInstructions: extraInstructions.value.trim() || null,
        },
      },
    });
    emit("generated");
    step.value = "complete";
  } catch (e) {
    actionError.value = errorMessage(e, t("podcast.wizard.audioFailed"));
  } finally {
    generatingAudio.value = false;
  }
}

function goToArtifacts() {
  emit("openArtifacts");
  open.value = false;
}

function resetWizard() {
  step.value = "review";
  actionError.value = null;
  script.value = "";
  podcastTitle.value = t("podcast.wizard.defaultTitle");
  extraInstructions.value = "";
}

async function loadSelectedDocumentTexts() {
  const lang = knowledgeApiLang(locale.value);
  const missingUids = [...new Set(selectedDocumentUids.value)].filter(
    (uid) => !documentContextByUid.value[uid] && !loadingDocumentUids.value.has(uid)
  );
  if (missingUids.length === 0) return;

  loadingDocumentUids.value = new Set([...loadingDocumentUids.value, ...missingUids]);
  try {
    await Promise.all(
      missingUids.map(async (uid) => {
        const response = await $fetch<{ document?: ArticleDocumentResponse }>(
          "/api/document-by-uid",
          { query: { uid, lang } }
        );
        const context = resolveDocumentContext(response.document);
        if (context) {
          documentContextByUid.value = {
            ...documentContextByUid.value,
            [uid]: context,
          };
        }
      })
    );
  } catch (e) {
    actionError.value = errorMessage(e, t("podcast.wizard.documentTextFailed"));
  } finally {
    const next = new Set(loadingDocumentUids.value);
    for (const uid of missingUids) next.delete(uid);
    loadingDocumentUids.value = next;
  }
}

interface ArticleDocumentResponse {
  fulltext?: string | null;
  summary?: string | null;
  subtitle?: string | null;
  keywords?: string[] | null;
  climate_impacts?: string[] | null;
  adaptation_approaches?: string[] | null;
  sectors?: string[] | null;
}

function resolveDocumentContext(
  document?: ArticleDocumentResponse
): ResolvedDocumentContext | null {
  if (!document) return null;
  const fulltext = document.fulltext?.trim() ?? "";
  const summary = document.summary?.trim() ?? "";
  if (!fulltext && !summary) return null;
  return {
    fulltext,
    summary,
    subtitle: document.subtitle?.trim() ?? "",
    metadata: {
      keywords: document.keywords ?? undefined,
      climateImpacts: document.climate_impacts ?? undefined,
      adaptationApproaches: document.adaptation_approaches ?? undefined,
      sectors: document.sectors ?? undefined,
    },
  };
}

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const row = error as Record<string, unknown>;
    if (typeof row.statusMessage === "string") return row.statusMessage;
    if (typeof row.message === "string") return row.message;
    const data = row.data as Record<string, unknown> | undefined;
    if (typeof data?.message === "string") return data.message;
  }
  return fallback;
}
</script>
