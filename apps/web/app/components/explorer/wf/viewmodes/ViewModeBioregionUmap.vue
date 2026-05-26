<template>
  <section class="relative p-4">
    <div
      v-if="results.length === 0"
      class="flex flex-col items-center justify-center py-16 text-gray-500 rounded-lg border border-gray-200 bg-gray-50"
    >
      <UIcon name="i-heroicons-circle-stack-20-solid" class="w-12 h-12 text-gray-300 mb-3" />
      <p class="text-lg font-medium">{{ $t('viewModes.umapEmpty') }}</p>
      <p class="text-sm">Run a search or adjust filters to see biogeographical regions</p>
    </div>
    <ClientOnly v-else>
      <div
        ref="el"
        class="w-full h-screen min-h-[480px] rounded-lg border border-gray-200 bg-neutral-lightest overflow-hidden"
      >
        <svg
          v-if="width > 0 && height > 0"
          :width="width"
          :height="height"
          :viewBox="`0 0 ${width} ${height}`"
          class="block touch-none select-none"
          :class="isGrabbing ? 'cursor-grabbing' : 'cursor-grab'"
          @pointerdown.capture="onCanvasPointerDown"
        >
          <rect width="100%" height="100%" class="fill-neutral-lightest pointer-events-none" />
          <!-- Hit target under the chart: clicks here clear region focus (gaps in <g> pass through). -->
          <rect
            width="100%"
            height="100%"
            fill="transparent"
            class="pointer-events-auto cursor-grab"
            @click="clearFocusedRegion"
          />

          <g class="pointer-events-none" :transform="`translate(${panX}, ${panY})`">
            <!-- One dashed circle per bioregion (groups hits that carry that region) -->
            <circle
              v-for="c in layoutRegionCircles"
              :key="'reg-' + c.region"
              :cx="c.cx"
              :cy="c.cy"
              :r="c.r"
              :opacity="opacityForRegion(c.region)"
              data-umap-region="1"
              class="pointer-events-auto cursor-grab fill-gray-400/5 stroke-gray-400 transition-all duration-200 hover:fill-gray-400/20 hover:stroke-gray-500"
              stroke-width="2"
              stroke-dasharray="6 4"
              @mouseenter="(e) => showRegionTip(e, c)"
              @mousemove="moveTip"
              @mouseleave="hideTip"
              @click.stop="onRegionClick(c)"
            />

            <!-- One dot = one search result -->
            <circle
              v-for="d in layoutDocs"
              :key="'hit-' + d.hitId"
              :cx="d.x"
              :cy="d.y"
              :r="DOT_R"
              :opacity="opacityForDoc(d)"
              data-umap-hit="1"
              class="fill-[#1E63A2] stroke-gray-900 stroke-2 cursor-pointer transition-all duration-200 hover:fill-[#154a7a] hover:stroke-black pointer-events-auto"
              @mouseenter="(e) => showDocTip(e, d)"
              @mousemove="moveTip"
              @mouseleave="hideTip"
              @click.stop="onDocClick(d)"
            />

            <!-- Region name always visible (no hover) -->
            <text
              v-for="c in layoutRegionCircles"
              :key="'lbl-' + c.region"
              :x="c.cx"
              :y="c.labelY"
              :opacity="opacityForRegion(c.region)"
              text-anchor="middle"
              dominant-baseline="middle"
              class="pointer-events-none select-none fill-gray-900 text-[11px] font-semibold transition-opacity duration-200"
              style="paint-order: stroke fill; stroke: rgba(255, 255, 255, 0.95); stroke-width: 3.5px; stroke-linejoin: round"
            >
              {{ displayRegionLabel(c.region) }}
            </text>
          </g>
        </svg>
      </div>
      <div
        v-if="tooltip.visible"
        class="fixed z-50 pointer-events-none rounded border border-gray-300 bg-white p-2 text-sm shadow-lg"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="font-semibold">{{ tooltip.title }}</div>
        <div
          v-if="tooltip.subtitle"
          class="mt-1 max-w-xs text-xs text-gray-700 whitespace-pre-line"
        >
          {{ tooltip.subtitle }}
        </div>
      </div>
      <template #fallback>
        <div
          class="flex min-h-[480px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
        >
          <UIcon name="i-heroicons-arrow-path-20-solid" class="h-8 w-8 animate-spin" />
        </div>
      </template>
    </ClientOnly>
  </section>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import * as d3 from 'd3'
import smallestEnclosingCircle from 'smallest-enclosing-circle'
import { UMAP } from 'umap-js'
import type { ArticleDetail, SearchResult } from '@/types/search'
import { buildPerHitUmapVectors, type SearchHitLike } from '@/utils/explorerBioregions'

/** Same radius for every search-result dot (v1: no size encoding). */
const DOT_R = 8
const REGION_PAD = 14

const props = withDefaults(
  defineProps<{
    results?: SearchHitLike[]
  }>(),
  { results: () => [] }
)

const emit = defineEmits<{
  'document-selected': [document: ArticleDetail]
}>()

const el = useTemplateRef('el')
const { width, height } = useElementSize(el)

type DocLayout = {
  hitId: string
  x: number
  y: number
  title: string
  doc: SearchResult | null | undefined
  /** Normalized bioregions for this hit (incl. no-identificados when applicable). */
  regions: string[]
}

type RegionCircleLayout = {
  region: string
  cx: number
  cy: number
  r: number
  count: number
  /** Vertical center of the label (SVG px). */
  labelY: number
}

const layoutDocs = ref<DocLayout[]>([])
const layoutRegionCircles = ref<RegionCircleLayout[]>([])

/** Pan offset (px) for draggable canvas */
const panX = ref(0)
const panY = ref(0)

type CanvasDragState = {
  pointerId: number
  sx: number
  sy: number
  ox: number
  oy: number
  active: boolean
}

const canvasDrag = ref<CanvasDragState | null>(null)
/** Suppress hit-dot click after a pan gesture (same pointer sequence). */
const blockDocClick = ref(false)

const isGrabbing = computed(() => Boolean(canvasDrag.value?.active))

/** When set, other regions and hits not in this region are faded. Cleared by clicking empty SVG. */
const focusedRegion = ref<string | null>(null)

const FADED_OPACITY = 0.12

function opacityForRegion(name: string) {
  const f = focusedRegion.value
  if (!f) return 1
  return f === name ? 1 : FADED_OPACITY
}

function opacityForDoc(d: DocLayout) {
  const f = focusedRegion.value
  if (!f) return 1
  return d.regions.includes(f) ? 1 : FADED_OPACITY
}

function clearFocusedRegion() {
  focusedRegion.value = null
}

function onRegionClick(c: RegionCircleLayout) {
  console.log('onRegionClick', c)
  if (blockDocClick.value) return
  focusedRegion.value = c.region
}

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  subtitle: '' as string,
})

function showDocTip(e: MouseEvent, d: DocLayout) {
  tooltip.visible = true
  tooltip.title = d.title || 'Untitled'
  tooltip.subtitle =
    d.regions.length > 0
      ? `Bioregions:\n${d.regions.map((r) => `• ${r}`).join('\n')}`
      : 'Bioregions:\n• —'
  moveTip(e)
}

function showRegionTip(e: MouseEvent, c: RegionCircleLayout) {
  tooltip.visible = true
  tooltip.title = c.region
  tooltip.subtitle = `${c.count} case ${c.count === 1 ? 'study' : 'studies'} in this region`
  moveTip(e)
}

function moveTip(e: MouseEvent) {
  tooltip.x = e.clientX + 12
  tooltip.y = e.clientY + 12
}

function hideTip() {
  tooltip.visible = false
}

function onDocClick(d: DocLayout) {
  if (blockDocClick.value) return
  if (d.doc?.id) emit('document-selected', d.doc as ArticleDetail)
}

const PAN_DRAG_THRESHOLD_PX = 5

/** Removes window listeners installed for panning (see onCanvasPointerDown). */
let detachPanWindowListeners: (() => void) | null = null

function onCanvasPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  if (canvasDrag.value) return

  canvasDrag.value = {
    pointerId: e.pointerId,
    sx: e.clientX,
    sy: e.clientY,
    ox: panX.value,
    oy: panY.value,
    active: false,
  }

  /**
   * Avoid svg.setPointerCapture: it retargets the click to the SVG, so
   * @click on region / hit circles never runs (hover still works).
   * Track drag on window instead so native click reaches the correct target.
   */
  const onMove = (ev: PointerEvent) => {
    const d = canvasDrag.value
    if (!d || ev.pointerId !== d.pointerId) return
    const dx = ev.clientX - d.sx
    const dy = ev.clientY - d.sy
    const dist2 = dx * dx + dy * dy
    if (!d.active && dist2 > PAN_DRAG_THRESHOLD_PX * PAN_DRAG_THRESHOLD_PX) {
      d.active = true
    }
    if (d.active) {
      panX.value = d.ox + dx
      panY.value = d.oy + dy
    }
  }

  const cleanupPanWindow = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    detachPanWindowListeners = null
  }

  const onUp = (ev: PointerEvent) => {
    const d = canvasDrag.value
    if (!d || ev.pointerId !== d.pointerId) return
    cleanupPanWindow()
    if (d.active) blockDocClick.value = true
    canvasDrag.value = null
    if (d.active) {
      queueMicrotask(() => {
        blockDocClick.value = false
      })
    }
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  detachPanWindowListeners = cleanupPanWindow
}

onUnmounted(() => {
  detachPanWindowListeners?.()
  canvasDrag.value = null
})

const REGION_LABEL_MAX = 34

function displayRegionLabel(name: string) {
  if (name.length <= REGION_LABEL_MAX) return name
  return `${name.slice(0, REGION_LABEL_MAX - 1)}…`
}

/** Place label above the circle, or below if it would clip the top of the SVG. */
function regionLabelY(cy: number, r: number, svgH: number): number {
  const margin = 12
  const offset = 14
  const above = cy - r - offset
  const below = cy + r + offset
  if (above >= margin) return Math.min(above, svgH - margin)
  if (below <= svgH - margin) return below
  return Math.max(margin, Math.min(svgH - margin, cy))
}

function normalizeV(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1
  return vec.map((x) => x / norm)
}

function resolveCircleCollisions(
  circles: { x: number; y: number; r: number }[],
  maxIterations = 100
) {
  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i]!
        const b = circles[j]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6
        const minDist = a.r + b.r + 6
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2
          const ox = (dx / dist) * overlap
          const oy = (dy / dist) * overlap
          a.x -= ox
          a.y -= oy
          b.x += ox
          b.y += oy
          moved = true
        }
      }
    }
    if (!moved) break
  }
  return circles
}

function computeLayout(w: number, h: number): {
  docs: DocLayout[]
  regions: RegionCircleLayout[]
} {
  const hits = props.results ?? []
  const pad = DOT_R * 2 + 32
  if (hits.length === 0 || w <= 0 || h <= 0) return { docs: [], regions: [] }

  const { regionNames, perHitRegions, vectors } = buildPerHitUmapVectors(hits)
  const rows = vectors.map((row) => normalizeV(row.map((v) => v + 1e-8)))

  let embedding: [number, number][]

  if (hits.length === 1) {
    embedding = [[0, 0]]
  } else {
    try {
      const n = hits.length
      const nNeighbors = Math.min(n - 1, Math.max(2, Math.min(15, Math.ceil(Math.sqrt(n)))))
      const umap = new UMAP({
        nComponents: 2,
        nNeighbors,
        minDist: 0.1,
      })
      const nEpochs = umap.initializeFit(rows)
      const steps = Math.min(nEpochs, 300)
      for (let i = 0; i < steps; i++) umap.step()
      embedding = umap.getEmbedding() as [number, number][]
      if (embedding.some((p) => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) {
        throw new Error('non-finite embedding')
      }
    } catch {
      embedding = hits.map((_, i) => {
        const t = (2 * Math.PI * i) / hits.length
        return [Math.cos(t) * 0.5, Math.sin(t) * 0.5] as [number, number]
      })
    }
  }

  const extX = d3.extent(embedding, (d) => d[0])
  const extY = d3.extent(embedding, (d) => d[1])
  const x0 = extX[0] ?? 0
  const x1 = extX[1] ?? 1
  const y0 = extY[0] ?? 0
  const y1 = extY[1] ?? 1
  const scaleX = d3.scaleLinear().domain([x0, x1]).range([pad, w - pad]).nice()
  const scaleY = d3.scaleLinear().domain([y0, y1]).range([h - pad, pad]).nice()

  const docCircles = hits.map((hit, i) => {
    const emb = embedding[i]!
    return {
      hitId: hit.id,
      x: scaleX(emb[0]!),
      y: scaleY(emb[1]!),
      r: DOT_R,
      title: hit.document?.title ?? 'Untitled',
      doc: hit.document,
    }
  })

  resolveCircleCollisions(docCircles)

  const docs: DocLayout[] = docCircles.map((c, i) => ({
    hitId: c.hitId,
    x: c.x,
    y: c.y,
    title: c.title,
    doc: c.doc,
    regions: [...perHitRegions[i]!],
  }))

  const regions: RegionCircleLayout[] = []

  for (const region of regionNames) {
    const locs: { x: number; y: number }[] = []
    for (let i = 0; i < perHitRegions.length; i++) {
      if (perHitRegions[i]!.includes(region)) {
        locs.push({ x: docCircles[i]!.x, y: docCircles[i]!.y })
      }
    }
    const count = locs.length
    if (count === 0) continue

    if (count === 1) {
      const p = locs[0]!
      const r = Math.max(DOT_R * 4, 22)
      regions.push({
        region,
        cx: p.x,
        cy: p.y,
        r,
        count: 1,
        labelY: regionLabelY(p.y, r, h),
      })
    } else {
      const sec = smallestEnclosingCircle(locs) as { x: number; y: number; r: number }
      const r = Math.max(sec.r + REGION_PAD, DOT_R * 3)
      regions.push({
        region,
        cx: sec.x,
        cy: sec.y,
        r,
        count,
        labelY: regionLabelY(sec.y, r, h),
      })
    }
  }

  return { docs, regions }
}

watch(
  () => [props.results, width.value, height.value] as const,
  () => {
    panX.value = 0
    panY.value = 0
    focusedRegion.value = null
    const { docs, regions } = computeLayout(width.value, height.value)
    layoutDocs.value = docs
    layoutRegionCircles.value = regions
  },
  { deep: true, immediate: true }
)
</script>
