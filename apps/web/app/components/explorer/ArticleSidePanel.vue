<template>
  <UModal
  
    :open="open"
    
    :description="$t('common.documentPreview')"
    
    class="bg-neutral-lightest max-w-[calc(100vw-64px)] max-h-[calc(100vh-48px)] w-[calc(100vw-64px)] h-[calc(100vh-48px)]"
    :ui="{
      header: 'hidden',
      footer: 'p-0',
      overlay: 'bg-black/70',
    }"
    :close="false"
    @update:open="(val) => !val && handleClose()"
  >
    

    <template #body>
       <div class="absolute top-4 right-8 z-30 flex items-center gap-1">
          <UButton
            v-if="canPinDocument"
            type="button"
            color="primary"
            variant="outline"
            size="sm"
            icon="i-lucide-pin"
            :aria-label="$t('pins.drawer.pinDocumentAria')"
            :loading="pinSaving"
            @click="handlePinClick"
          />
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="md"
            class="bg-transparent"
            icon="i-lucide-x"
            :aria-label="$t('common.close')"
            @click="handleClose"
          />
        </div>
        
      <div class="relative h-full w-full flex flex-col">
        <!-- Top-right header chrome: pin + close (per Figma) -->
        

        <div class="flex-1 min-h-0 overflow-hidden">
          <div v-if="isLoading" class="space-y-4 p-6">
            <div class="flex items-center gap-3 text-sm text-muted">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
              <span>{{ $t("pins.drawer.loading") }}</span>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-elevated rounded animate-pulse w-3/4" />
              <div class="h-4 bg-elevated rounded animate-pulse w-full" />
              <div class="h-4 bg-elevated rounded animate-pulse w-5/6" />
              <div class="h-4 bg-elevated rounded animate-pulse w-2/3" />
            </div>
          </div>

          <UAlert
            v-else-if="loadError"
            color="error"
            variant="soft"
            class="m-4"
            icon="i-heroicons-exclamation-triangle"
            :title="$t('pins.drawer.loadError')"
            :description="loadError"
          />

          <ArticleViewAI
            v-else-if="resolvedDocument"
            ref="articleViewRef"
            :document="resolvedDocument"
            chrome="modal"
            class="h-full"
          >
            <template #pins-after>
              <section
                v-if="pins && pins.length > 0"
                class="mx-6 mt-4 mb-6 rounded-lg border border-teal-200 bg-teal-50/60 p-4"
              >
                <header class="mb-3 flex items-baseline gap-2">
                  <h3 class="text-sm font-semibold text-default">
                    {{ $t("pins.drawer.pinsInArticleHeader") }}
                  </h3>
                  <span class="text-xs text-muted">({{ pins.length }})</span>
                </header>
                <ul class="divide-y divide-teal-200/60">
                  <li
                    v-for="pin in pins"
                    :key="pin.id"
                    class="py-3 first:pt-0 last:pb-0"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-block bg-teal-100 text-teal-800 text-[11px] px-2 py-0.5 rounded-full"
                      >
                        {{ pinKindLabel(pin.body_kind) }}
                      </span>
                    </div>
                    <p
                      v-if="pin.user_note?.trim()"
                      class="mt-2 text-sm text-default whitespace-pre-wrap"
                    >
                      {{ pin.user_note }}
                    </p>
                  </li>
                </ul>
              </section>
            </template>
          </ArticleViewAI>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { DialogDescription, DialogTitle } from "reka-ui";
import { useI18n } from "vue-i18n";
import type { ArticleDetail } from "@/types/search";
import type { HumanPinRow } from "@/types/pins";
import ArticleViewAI from "./ArticleViewAI.vue";

const { t: $t, te } = useI18n();

const props = defineProps<{
  document?: ArticleDetail | null;
  documentUid?: string | null;
  titleFallback?: string | null;
  pins?: HumanPinRow[];
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

if (import.meta.dev) {
  const hasDoc = props.document != null;
  const hasUid = !!props.documentUid;
  if (hasDoc === hasUid) {
    console.warn(
      "[ArticleSidePanel] exactly one of `document` or `documentUid` must be provided",
      { hasDocument: hasDoc, hasDocumentUid: hasUid },
    );
  }
}

const resolvedDocument = ref<ArticleDetail | null>(props.document ?? null);
const loadError = ref<string | null>(null);
const isLoading = ref(false);

const articleViewRef = ref<{
  openDocumentPinDialog?: () => void;
  isAuthenticated?: { value: boolean };
} | null>(null);

const pinSaving = ref(false);

watch(
  () => props.document,
  (doc) => {
    if (doc) {
      resolvedDocument.value = doc;
      loadError.value = null;
      isLoading.value = false;
    }
  },
);

async function resolveByUid(uid: string): Promise<void> {
  isLoading.value = true;
  loadError.value = null;
  try {
    const res = await $fetch<{ document: ArticleDetail }>(
      "/api/document-by-uid",
      { query: { uid } },
    );
    if (res?.document) {
      resolvedDocument.value = res.document;
    } else {
      loadError.value = $t("pins.drawer.loadError");
    }
  } catch (err: any) {
    console.error("[ArticleSidePanel] failed to resolve document", err);
    loadError.value =
      err?.statusMessage || err?.message || $t("pins.drawer.loadError");
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.documentUid,
  (uid) => {
    if (!uid) return;
    if (resolvedDocument.value?.document_uid === uid) return;
    resolvedDocument.value = null;
    void resolveByUid(uid);
  },
  { immediate: true },
);

const headerTitle = computed(
  () =>
    resolvedDocument.value?.title ||
    props.titleFallback ||
    $t("common.documentPreview"),
);

const canPinDocument = computed<boolean>(() => {
  const isAuthed = articleViewRef.value?.isAuthenticated?.value ?? false;
  return isAuthed && !!resolvedDocument.value;
});

function pinKindLabel(kind: string): string {
  const key = `pins.kinds.${kind || "unknown"}`;
  return te(key) ? $t(key) : $t("pins.kinds.unknown");
}

function handlePinClick(): void {
  articleViewRef.value?.openDocumentPinDialog?.();
}

function handleClose(): void {
  emit("close");
}
</script>
