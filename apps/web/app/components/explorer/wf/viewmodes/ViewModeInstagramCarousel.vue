<template>
  <div class="group/carousel relative w-full bg-neutral-100">
    <div
      ref="scrollerRef"
      role="region"
      :aria-label="regionLabel"
      tabindex="0"
      class="flex w-full overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      @scroll.passive="onScroll"
      @keydown="onKeydown"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
      <div
        v-for="(slide, i) in slides"
        :key="slideKey(slide, i)"
        class="w-full shrink-0 snap-center snap-always"
      >
        <div
          class="relative aspect-4/3 w-full overflow-hidden bg-neutral-100"
        >
          <img
            :src="slide.src"
            :alt="slide.alt"
            loading="lazy"
            class="absolute inset-0 h-full w-full cursor-pointer object-cover"
            @error="onImgError"
            @click="onImageClick"
          />
        </div>
      </div>
    </div>

    <template v-if="hasMultipleSlides">
      <UButton
        type="button"
        color="neutral"
        variant="solid"
        size="xs"
        icon="i-lucide-chevron-left"
        :disabled="!canGoPrev"
        :aria-label="prevAriaLabel"
        class="pointer-events-auto absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full opacity-90 shadow-sm transition-opacity group-hover/carousel:opacity-100 disabled:opacity-40"
        @click.stop="goToPrev"
      />
      <UButton
        type="button"
        color="neutral"
        variant="solid"
        size="xs"
        icon="i-lucide-chevron-right"
        :disabled="!canGoNext"
        :aria-label="nextAriaLabel"
        class="pointer-events-auto absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full opacity-90 shadow-sm transition-opacity group-hover/carousel:opacity-100 disabled:opacity-40"
        @click.stop="goToNext"
      />
    </template>

    <div
      v-if="hasMultipleSlides"
      class="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5"
      role="tablist"
      :aria-label="dotsTablistLabel"
    >
      <button
        v-for="(_, i) in slides"
        :key="'dot-' + i"
        type="button"
        role="tab"
        :tabindex="i === activeIndex ? 0 : -1"
        :aria-selected="i === activeIndex"
        :aria-label="dotAria(i)"
        class="pointer-events-auto h-1.5 w-1.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="i === activeIndex ? 'bg-neutral-800' : 'bg-neutral-400/90'"
        @click.stop="goToSlideFromDot(i)"
      />
    </div>

    <div :id="liveId" aria-live="polite" class="sr-only">
      {{ slideStatusText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocumentImage } from '~/types'

const PLACEHOLDER = '/img/img_placeholder.png'

const props = defineProps<{
  images?: DocumentImage[] | null
}>()

const emit = defineEmits<{
  activate: []
}>()

const { t } = useI18n()

const scrollerRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const liveId = useId()

let pointerDown = false
let startX = 0
let startY = 0
let indexAtPointerDown = 0
let slideChangedDuringPointer = false
const suppressOpenUntil = ref(0)
const POINTER_SUPPRESS_MS = 450

const sortedImages = computed(() => {
  const raw = Array.isArray(props.images) ? [...props.images] : []
  raw.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  return raw
})

const slides = computed(() => {
  const raw = sortedImages.value
  const n = raw.length
  if (n === 0) {
    return [
      {
        src: PLACEHOLDER,
        alt: t('viewModes.instagramImageNofM', { n: 1, total: 1 }),
      },
    ]
  }
  return raw.map((img, idx) => ({
    src: img.public_url?.trim() || PLACEHOLDER,
    alt:
      img.title?.trim()
      || t('viewModes.instagramImageNofM', { n: idx + 1, total: n }),
  }))
})

function slideKey(slide: { src: string; alt: string }, i: number) {
  return `${i}-${slide.src}`
}

const regionLabel = computed(() => t('viewModes.instagramCarouselRegion'))

const dotsTablistLabel = computed(() =>
  t('viewModes.instagramCarouselDotsTablist'),
)

const slideStatusText = computed(() =>
  t('viewModes.instagramSlideStatus', {
    current: activeIndex.value + 1,
    total: slides.value.length,
  }),
)

const hasMultipleSlides = computed(() => slides.value.length > 1)

const canGoPrev = computed(() => activeIndex.value > 0)

const canGoNext = computed(
  () => activeIndex.value < slides.value.length - 1,
)

const prevAriaLabel = computed(() => t('viewModes.instagramCarouselPrev'))

const nextAriaLabel = computed(() => t('viewModes.instagramCarouselNext'))

function dotAria(i: number) {
  return t('viewModes.instagramDotAria', { n: i + 1 })
}

function markSlideNavigation() {
  suppressOpenUntil.value = Date.now() + POINTER_SUPPRESS_MS
  slideChangedDuringPointer = true
}

function goToPrev() {
  if (!canGoPrev.value) return
  markSlideNavigation()
  goToSlide(activeIndex.value - 1)
}

function goToNext() {
  if (!canGoNext.value) return
  markSlideNavigation()
  goToSlide(activeIndex.value + 1)
}

function onKeydown(e: KeyboardEvent) {
  if (!hasMultipleSlides.value) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goToPrev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goToNext()
  }
}

function getScrollIndex(): number {
  const el = scrollerRef.value
  if (!el || el.clientWidth === 0) return 0
  return Math.round(el.scrollLeft / el.clientWidth)
}

function onScroll() {
  const el = scrollerRef.value
  if (!el) return
  const i = getScrollIndex()
  if (i !== activeIndex.value) activeIndex.value = i
  if (pointerDown && i !== indexAtPointerDown) slideChangedDuringPointer = true
}

function goToSlide(i: number) {
  const el = scrollerRef.value
  if (!el || el.clientWidth === 0) return
  const clamped = Math.max(0, Math.min(i, slides.value.length - 1))
  el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
  activeIndex.value = clamped
}

function goToSlideFromDot(i: number) {
  markSlideNavigation()
  goToSlide(i)
}

function onPointerDown(e: PointerEvent) {
  pointerDown = true
  startX = e.clientX
  startY = e.clientY
  indexAtPointerDown = getScrollIndex()
  slideChangedDuringPointer = false
}

function onPointerUp(e: PointerEvent) {
  if (!pointerDown) return
  pointerDown = false
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  const horizontalIntent =
    Math.abs(dx) > 24 || (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12)
  const endIndex = getScrollIndex()
  if (
    slideChangedDuringPointer
    || horizontalIntent
    || endIndex !== indexAtPointerDown
  ) {
    suppressOpenUntil.value = Date.now() + POINTER_SUPPRESS_MS
  }
}

function onPointerCancel() {
  pointerDown = false
}

function onImageClick() {
  if (Date.now() < suppressOpenUntil.value) return
  emit('activate')
}

function onImgError(ev: Event) {
  const el = ev.target
  if (el instanceof HTMLImageElement) {
    el.src = PLACEHOLDER
  }
}

function resetScrollPosition() {
  activeIndex.value = 0
  nextTick(() => {
    scrollerRef.value?.scrollTo({ left: 0, behavior: 'auto' })
  })
}

watch(() => props.images, resetScrollPosition, { deep: true })

onMounted(() => {
  activeIndex.value = getScrollIndex()
})
</script>
