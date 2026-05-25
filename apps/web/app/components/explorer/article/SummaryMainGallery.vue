<template>
  <div class="summary-main-gallery shrink-0 pt-10">
    <div
      v-if="galleryImages.length > 0"
      class="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-3 scrollbar-thin scrollbar-thumb-neutral-400 scrollbar-track-transparent"
    >
      <CapturableBlock
        v-for="(img, index) in galleryImages"
        :key="img.public_url"
        :label="img.title || $t('article.imageNumber', { n: index + 1 })"
        icon="mdi:image-outline"
        pin-kind="image"
        source-view="summary"
        :payload="imagePinPayload(img, index)"
        :preview="
          img.description ||
          img.title ||
          $t('article.imageNumber', { n: index + 1 })
        "
        :chrome="false"
        class="shrink-0 snap-start"
      >
        <button
          type="button"
          class="block w-50 cursor-zoom-in rounded border-0 bg-transparent p-0 text-left overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :aria-label="$t('article.openImageLightbox')"
          @click.stop="openLightbox(img, index)"
        >
          <img
            :src="img.public_url"
            :alt="img.title || $t('article.imageAlt', { n: index + 1 })"
            class="h-30 w-50 rounded border border-default object-cover"
          />
        </button>
      </CapturableBlock>
    </div>
    <div
      v-else
      class="flex items-center gap-3 rounded-md border border-dashed border-default bg-elevated/50 p-3"
    >
      <img
        src="/img/img_placeholder.png"
        alt=""
        class="aspect-video h-16 w-28 shrink-0 rounded border border-default object-cover opacity-80"
      />
      <p class="text-sm text-muted">{{ $t("article.noImagesInGallery") }}</p>
    </div>

    <AppImageLightbox
      v-model:open="lightboxOpen"
      :src="lightboxSrc"
      :alt="lightboxAlt"
      :title="lightboxTitle"
      :description="lightboxDescription"
      :credits="lightboxCredits"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import CapturableBlock from "../CapturableBlock.vue";

interface GalleryImage {
  public_url: string;
  title?: string | null;
  description?: string | null;
  credits?: string | null;
}

const props = defineProps<{
  document: Record<string, unknown> & {
    images?: GalleryImage[];
  };
}>();

const { t: $t } = useI18n();

const lightboxOpen = ref(false);
const lightboxSrc = ref("");
const lightboxAlt = ref("");
const lightboxTitle = ref<string | null>(null);
const lightboxDescription = ref<string | null>(null);
const lightboxCredits = ref<string | null>(null);

const galleryImages = computed<GalleryImage[]>(() => {
  const raw = props.document?.images;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (img): img is GalleryImage =>
      !!img && typeof img.public_url === "string" && img.public_url.length > 0,
  );
});

function openLightbox(img: GalleryImage, index: number): void {
  lightboxSrc.value = img.public_url;
  lightboxAlt.value = img.title || $t("article.imageAlt", { n: index + 1 });
  lightboxTitle.value = img.title || null;
  lightboxDescription.value = img.description || null;
  lightboxCredits.value = img.credits || null;
  lightboxOpen.value = true;
}

function imagePinPayload(img: GalleryImage, index: number) {
  return {
    src: img.public_url,
    alt: img.title || $t("article.imageAlt", { n: index + 1 }),
    title: img.title || null,
    description: img.description || null,
    credits: img.credits || null,
    sourceView: "summary",
  };
}
</script>
