<template>
  <UModal
  
    :open="open"
    
    :description="$t('common.documentPreview')"
    
    class="bg-neutral-lightest max-w-[calc(100vw-64px)] max-h-[calc(100vh-48px)] w-[calc(100vw-64px)] h-[calc(100vh-48px)]"
    :ui="modalUi"
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

    <template v-if="showPanelNav" #footer>
      <div
        class="flex w-full items-center justify-between gap-4 px-9 py-[18px] border-t border-default bg-trust-blue-100/45"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3.5">
          <UButton
            type="button"
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            size="sm"
            class="shrink-0 rounded-full"
            :disabled="!prevNavTarget"
            :aria-label="$t('article.panelNav.prevAria')"
            @click="goPrev"
          />
          <div class="min-w-0">
            <p
              class="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted"
            >
              {{ $t("article.panelNav.previousCase") }}
            </p>
            <p class="truncate text-[13px] text-neutral-darkest">
              {{ prevNavTarget?.title ?? "—" }}
            </p>
          </div>
        </div>
        <p
          class="hidden shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted sm:block text-center max-w-[min(280px,28vw)]"
        >
          {{ $t("article.panelNav.keyboardHint") }}
        </p>
        <div class="flex min-w-0 flex-1 items-center justify-end gap-3.5">
          <div class="min-w-0 text-right">
            <p
              class="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted"
            >
              {{ $t("article.panelNav.nextCase") }}
            </p>
            <p class="truncate text-[13px] text-neutral-darkest">
              {{ nextNavTarget?.title ?? "—" }}
            </p>
          </div>
          <UButton
            type="button"
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            size="sm"
            class="shrink-0 rounded-full"
            :disabled="!nextNavTarget"
            :aria-label="$t('article.panelNav.nextAria')"
            @click="goNext"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import type { ArticleDetail } from "@/types/search";
import type { HumanPinRow } from "@/types/pins";
import ArticleViewAI from "./ArticleViewAI.vue";

export interface ArticlePanelNavItem {
  uid: string;
  title: string;
}

const { t: $t, te } = useI18n();

const props = defineProps<{
  document?: ArticleDetail | null;
  documentUid?: string | null;
  titleFallback?: string | null;
  pins?: HumanPinRow[];
  open: boolean;
  /** Ordered list for preview footer prev/next; omit or &lt; 2 items to hide navigation. */
  navigationItems?: ArticlePanelNavItem[] | null;
}>();

const emit = defineEmits<{
  close: [];
  navigate: [uid: string];
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

const showPanelNav = computed(
  () => (props.navigationItems?.length ?? 0) >= 2,
);

const modalUi = computed(() => ({
  header: "hidden" as const,
  body: "p-0 sm:p-0 flex-1 min-h-0 overflow-hidden" as const,
  footer: showPanelNav.value ? ("p-0 shrink-0 sm:px-0" as const) : ("p-0 sm:px-0" as const),
  overlay: "bg-black/70" as const,
}));

/** Stable id for matching against `navigationItems[].uid`. */
const activeNavUid = computed<string | null>(() => {
  const d = resolvedDocument.value;
  if (d) {
    const u = d.document_uid;
    if (typeof u === "string" && u.trim()) return u.trim();
    if (d.id != null && String(d.id).trim()) return String(d.id).trim();
  }
  const p = props.documentUid;
  if (typeof p === "string" && p.trim()) return p.trim();
  return null;
});

const navigationNavIndex = computed(() => {
  const items = props.navigationItems;
  if (!items?.length) return -1;
  const uid = activeNavUid.value;
  if (!uid) return -1;
  return items.findIndex((x) => x.uid === uid);
});

/** Title shown on the left: the article you go to when pressing “previous”. */
const prevNavTarget = computed<ArticlePanelNavItem | null>(() => {
  const items = props.navigationItems;
  const i = navigationNavIndex.value;
  if (!items?.length || i < 0) return null;
  return i > 0 ? items[i - 1]! : null;
});

/** Title on the right: the article you go to when pressing “next”. */
const nextNavTarget = computed<ArticlePanelNavItem | null>(() => {
  const items = props.navigationItems;
  const i = navigationNavIndex.value;
  if (!items?.length || i < 0) return null;
  return i < items.length - 1 ? items[i + 1]! : null;
});

function goPrev(): void {
  const t = prevNavTarget.value;
  if (t) emit("navigate", t.uid);
}

function goNext(): void {
  const t = nextNavTarget.value;
  if (t) emit("navigate", t.uid);
}

useEventListener(
  () => (typeof window !== "undefined" ? window : null),
  "keydown",
  (e: KeyboardEvent) => {
    if (!props.open || !showPanelNav.value) return;
    if (!e.altKey) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  },
);

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
    const d = resolvedDocument.value;
    if (d) {
      const du =
        typeof d.document_uid === "string" && d.document_uid.trim()
          ? d.document_uid.trim()
          : null;
      const idStr = d.id != null ? String(d.id).trim() : null;
      if (uid === du || uid === idStr) return;
    }
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
