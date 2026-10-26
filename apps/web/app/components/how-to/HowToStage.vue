<script setup lang="ts">
interface HowToStep {
  key: string
  title: string
  body: string
  image: string
  imageAlt: string
}

interface HowToIntro {
  titleLines: string[]
  accent: string
  kickerLines: string[]
  before: string
  emphasis: string
  middle: string
  recipe: string
  after: string
}

const props = defineProps<{
  intro: HowToIntro
  steps: HowToStep[]
  cta: { label: string, to: string, image: string }
}>()

const STEP_GROUNDS = [
  'bg-adapt-brown',
  'bg-adapt-paper',
  'bg-adapt-yellow',
  'bg-adapt-foam',
  'bg-adapt-blue',
  'bg-adapt-orange',
  'bg-adapt-mist',
] as const

const pinned = ref(0)
const preview = ref<number | null>(null)
const canHover = ref(false)
const reduceMotion = ref(false)
const faded = ref(false)
const displaySrc = ref(props.steps[0]?.image ?? '')
const displayAlt = ref(props.steps[0]?.imageAlt ?? '')

const buttonEls: HTMLButtonElement[] = []
let hoverQuery: MediaQueryList | undefined
let motionQuery: MediaQueryList | undefined
let fadeTimer: number | undefined

const shown = computed(() => preview.value ?? pinned.value)

function syncHover() {
  canHover.value = hoverQuery?.matches ?? false
  if (!canHover.value) preview.value = null
}

function syncMotion() {
  reduceMotion.value = motionQuery?.matches ?? false
}

function groundClass(index: number) {
  return STEP_GROUNDS[index] ?? 'bg-adapt-mist'
}

function onEnter(index: number) {
  if (!canHover.value) return
  preview.value = index
}

function onLeave() {
  preview.value = null
}

function pin(index: number) {
  pinned.value = index
  preview.value = null
}

function setButton(index: number, el: unknown) {
  if (el instanceof HTMLButtonElement) buttonEls[index] = el
}

function onKeydown(event: KeyboardEvent, index: number) {
  const last = props.steps.length - 1
  const moves: Record<string, number> = {
    ArrowRight: Math.min(last, index + 1),
    ArrowDown: Math.min(last, index + 1),
    ArrowLeft: Math.max(0, index - 1),
    ArrowUp: Math.max(0, index - 1),
    Home: 0,
    End: last,
  }
  const next = moves[event.key]
  if (next === undefined || next === index) return
  event.preventDefault()
  pin(next)
  nextTick(() => buttonEls[next]?.focus())
}

function showImage(index: number) {
  const step = props.steps[index]
  if (!step) return
  if (fadeTimer !== undefined) window.clearTimeout(fadeTimer)
  if (reduceMotion.value || displaySrc.value === step.image) {
    displaySrc.value = step.image
    displayAlt.value = step.imageAlt
    faded.value = false
    return
  }
  faded.value = true
  fadeTimer = window.setTimeout(() => {
    displaySrc.value = step.image
    displayAlt.value = step.imageAlt
    faded.value = false
  }, 250)
}

watch(
  () => {
    const step = props.steps[shown.value]
    return step ? `${shown.value}|${step.image}|${step.imageAlt}` : ''
  },
  () => showImage(shown.value),
)

onMounted(() => {
  hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncHover()
  syncMotion()
  hoverQuery.addEventListener('change', syncHover)
  motionQuery.addEventListener('change', syncMotion)
  for (const step of props.steps) {
    const img = new Image()
    img.src = step.image
  }
})

onUnmounted(() => {
  hoverQuery?.removeEventListener('change', syncHover)
  motionQuery?.removeEventListener('change', syncMotion)
  if (fadeTimer !== undefined) window.clearTimeout(fadeTimer)
})
</script>

<template>
  <section class="relative min-h-[calc(100dvh-3.5rem)] bg-adapt-sea text-adapt-ink">
    <div class="grid items-center gap-8 px-6 pt-10 pb-6 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:px-10 lg:pt-14 lg:pr-52 lg:pb-32">
      <div>
        <h1>
          <span
            v-for="line in intro.titleLines"
            :key="line"
            class="block font-adapt-title text-4xl leading-none"
          >
            {{ line }}
          </span>
          <span class="mt-1 block font-adapt-heavy text-[1.75rem] leading-[0.8] tracking-[1px] text-adapt-paper">
            {{ intro.accent }}
          </span>
        </h1>
        <p class="mt-9 font-adapt-keyword text-3xl leading-none tracking-[1px] uppercase">
          <span v-for="line in intro.kickerLines" :key="line" class="block">{{ line }}</span>
        </p>
        <p class="mt-2 max-w-xs font-adapt-body text-base leading-snug text-white">
          {{ intro.before }}<span class="font-adapt-heavy text-base text-adapt-ink uppercase">{{ intro.emphasis }}</span>{{ intro.middle }}
        </p>
        <p class="mt-2 font-adapt-keyword text-[2.3125rem] leading-none tracking-[1px] text-adapt-yellow uppercase">
          {{ intro.recipe }}
        </p>
        <p class="mt-2 max-w-xs font-adapt-body text-base leading-snug text-white">
          {{ intro.after }}
        </p>
      </div>
      <img
        :src="displaySrc"
        :alt="displayAlt"
        class="w-full object-contain"
        :class="[
          reduceMotion ? '' : 'transition-opacity duration-[250ms]',
          faded ? 'opacity-0' : 'opacity-100',
        ]"
      >
    </div>

    <div class="px-6 pb-8 lg:absolute lg:top-8 lg:right-6 lg:px-0 lg:pb-0">
      <StoneCta
        :label="cta.label"
        :to="cta.to"
        :image="cta.image"
        appearance="light"
        layout="stack"
      />
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:absolute lg:inset-x-0 lg:bottom-0 lg:grid-cols-7"
      :aria-label="intro.titleLines.join(' ')"
    >
      <button
        v-for="(step, index) in steps"
        :key="step.key"
        :ref="(el) => setButton(index, el)"
        type="button"
        class="relative flex w-full flex-col overflow-visible text-left text-adapt-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-adapt-ink"
        :class="[
          groundClass(index),
          shown === index ? 'z-10' : '',
          shown === index
            ? 'min-h-48 justify-start px-[18px] py-6 lg:h-[5.625rem] lg:min-h-0 lg:justify-end lg:py-0 lg:pb-[18px]'
            : 'h-[5.625rem] justify-end px-[18px] pb-[18px]',
        ]"
        :aria-pressed="pinned === index"
        @pointerenter="onEnter(index)"
        @pointerleave="onLeave"
        @click="pin(index)"
        @keydown="onKeydown($event, index)"
      >
        <span
          class="font-adapt-keyword text-[1.3125rem] leading-none tracking-wide uppercase"
          :class="shown === index ? 'lg:invisible' : ''"
        >
          {{ index + 1 }}. {{ step.title }}
        </span>
        <span
          v-if="shown === index"
          class="mt-3 font-adapt-body text-base leading-snug lg:hidden"
        >
          {{ step.body }}
        </span>
        <span
          v-if="shown === index"
          class="absolute bottom-full left-0 hidden min-h-[220px] w-full flex-col px-[18px] py-6 lg:flex"
          :class="groundClass(index)"
        >
          <span class="font-adapt-keyword text-[1.3125rem] leading-none tracking-wide uppercase">
            {{ index + 1 }}. {{ step.title }}
          </span>
          <span class="mt-3.5 font-adapt-body text-base leading-snug">{{ step.body }}</span>
        </span>
      </button>
    </div>
  </section>
</template>
