<template>
  <USlideover :open="open" class="max-w-5xl" :overlay="false" :title="headerTitle" :modal="false">
    <template #header>
      <DialogTitle class="sr-only">
        {{ headerTitle }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        Detailed article panel with summary, map, and metadata.
      </DialogDescription>

      <div class="flex gap-2 items-center">
        <UButton
          v-if="resolvedDocument?.id"
          :to="`/articles/${resolvedDocument.id}`"
          target="_blank"
          variant="ghost"
          :title="$t('common.openFullPage')"
          icon="mdi:open-in-new"
        />
        <h2 class="font-semibold">{{ headerTitle }}</h2>
        <UButton @click="handleClose" icon="mdi:close" variant="ghost" />
      </div>
    </template>
    <template #body>
      <div v-if="isLoading" class="space-y-4 p-4">
        <div class="flex items-center gap-3 text-sm text-neutral-500">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
          <span>{{ $t("pins.drawer.loading") }}</span>
        </div>
        <div class="space-y-2">
          <div class="h-4 bg-neutral-200 rounded animate-pulse w-3/4" />
          <div class="h-4 bg-neutral-200 rounded animate-pulse w-full" />
          <div class="h-4 bg-neutral-200 rounded animate-pulse w-5/6" />
          <div class="h-4 bg-neutral-200 rounded animate-pulse w-2/3" />
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

      <template v-else-if="resolvedDocument">
        <ArticleViewAI :document="resolvedDocument" :show-sidebar="false" />

        <section
          v-if="pins && pins.length > 0"
          class="mx-4 mt-6 mb-8 rounded-lg border border-teal-200 bg-teal-50/60 p-4"
        >
          <header class="mb-3 flex items-baseline gap-2">
            <h3 class="text-sm font-semibold text-neutral-800">
              {{ $t("pins.drawer.pinsInArticleHeader") }}
            </h3>
            <span class="text-xs text-neutral-500">({{ pins.length }})</span>
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
                class="mt-2 text-sm text-neutral-700 whitespace-pre-wrap"
              >
                {{ pin.user_note }}
              </p>
            </li>
          </ul>
        </section>
      </template>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
      { hasDocument: hasDoc, hasDocumentUid: hasUid }
    );
  }
}

const resolvedDocument = ref<ArticleDetail | null>(props.document ?? null);
const loadError = ref<string | null>(null);
const isLoading = ref(false);

watch(
  () => props.document,
  (doc) => {
    if (doc) {
      resolvedDocument.value = doc;
      loadError.value = null;
      isLoading.value = false;
    }
  }
);

async function resolveByUid(uid: string) {
  isLoading.value = true;
  loadError.value = null;
  try {
    const res = await $fetch<{ document: ArticleDetail }>(
      "/api/document-by-uid",
      { query: { uid } }
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
    resolveByUid(uid);
  },
  { immediate: true }
);

const headerTitle = computed(() => {
  return (
    resolvedDocument.value?.title ||
    props.titleFallback ||
    $t("common.documentPreview")
  );
});

function pinKindLabel(kind: string): string {
  const key = `pins.kinds.${kind || "unknown"}`;
  return te(key) ? $t(key) : $t("pins.kinds.unknown");
}

function disableScroll() {
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = "15px";
}

function enableScroll() {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

function handleClose() {
  enableScroll();
  emit("close");
}

onMounted(() => {
  disableScroll();
});

onBeforeUnmount(() => {
  enableScroll();
});
</script>

<style scoped>
.side-panel-enter-active,
.side-panel-leave-active {
  transition: transform 0.3s ease;
}

.side-panel-enter-from,
.side-panel-leave-to {
  transform: translateX(-100%);
}
</style>
