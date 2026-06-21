<template>
  <section class="relative p-4">
    <div class="mb-4 max-w-[760px]">
      <p class="font-sans text-[15px] leading-snug text-neutral-darker">
        {{ $t('viewModes.umapIntro') }}
      </p>
      <p class="mt-2 font-sans text-sm leading-snug text-neutral-dark">
        {{ $t('viewModes.umapIntroNote') }}
      </p>
    </div>

    <div
      v-if="results.length === 0"
      class="flex flex-col items-center justify-center py-16 text-gray-500 rounded-lg border border-gray-200 bg-gray-50"
    >
      <UIcon name="i-heroicons-circle-stack-20-solid" class="w-12 h-12 text-gray-300 mb-3" />
      <p class="text-lg font-medium">{{ $t('viewModes.umapEmpty') }}</p>
      <p class="text-sm">{{ $t('viewModes.umapEmptyDescription') }}</p>
    </div>
    <ClientOnly v-else>
      <div
        ref="el"
        class="relative w-full h-[60vh] min-h-[400px] rounded-lg border border-gray-200 bg-neutral-lightest overflow-hidden"
      >
        <!-- Continent legend -->
        <div
          v-if="legendItems.length > 0"
          class="absolute right-3 top-3 z-10 max-h-[calc(100%-24px)] w-[260px] overflow-y-auto border border-neutral-darkest bg-neutral-lightest shadow-sm"
        >
          <header class="border-b border-neutral-darkest px-4 py-3">
            <p class="font-mono text-xs font-bold tracking-[0.06em] text-neutral-darkest">
              {{ $t('viewModes.umapBioregionsLabel') }}
            </p>
            <p class="mt-1 text-2xs text-neutral-dark leading-snug">
              {{ $t('viewModes.umapContinentLegendHelp') }}
            </p>
          </header>
          <ul class="flex flex-col gap-2 p-4">
            <li
              v-for="item in legendItems"
              :key="item.region"
              class="flex cursor-pointer items-center gap-2.5 transition-opacity"
              :class="pinnedRegion && pinnedRegion !== item.region ? 'opacity-40' : ''"
              @mouseenter="focusedRegion = item.region"
              @mouseleave="focusedRegion = pinnedRegion"
              @click="togglePinnedRegion(item.region)"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-full border-2 border-dashed transition-colors"
                :style="{
                  borderColor: bioregionColor(item.region),
                  backgroundColor:
                    focusedRegion === item.region
                      ? `${bioregionColor(item.region)}33`
                      : 'transparent',
                }"
              />
              <span class="min-w-0 flex-1 font-mono text-[11px] text-neutral-darkest leading-tight">
                {{ displayRegionLabel(item.region) }}
              </span>
              <span class="font-mono text-2xs text-neutral-dark tabular-nums">
                {{ item.count }}
              </span>
            </li>
          </ul>
          <p class="border-t border-neutral-darkest px-4 py-2 text-2xs text-neutral-dark leading-snug">
            {{ $t('viewModes.umapBridgeHint') }}
          </p>
        </div>

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
          <rect
            width="100%"
            height="100%"
            fill="transparent"
            class="pointer-events-auto cursor-grab"
            @click="clearFocusedRegion"
          />

          <g class="pointer-events-none" :transform="`translate(${panX}, ${panY})`">
            <circle
              v-for="c in layoutRegionCircles"
              :key="'reg-' + c.region"
              :cx="c.cx"
              :cy="c.cy"
              :r="c.r"
              :opacity="opacityForRegion(c.region)"
              data-umap-region="1"
              class="pointer-events-auto cursor-grab transition-all duration-200"
              :fill="ringFill(c.region)"
              :stroke="bioregionColor(c.region)"
              :stroke-opacity="ringStrokeOpacity(c.region)"
              stroke-width="2"
              :stroke-dasharray="isUnidentifiedRegion(c.region) ? '3 5' : '6 4'"
              @mouseenter="(e) => showRegionTip(e, c)"
              @mousemove="moveTip"
              @mouseleave="hideTip"
              @click.stop="onRegionClick(c)"
            />

            <!-- Bridge halo for multi-region hits -->
            <circle
              v-for="d in bridgeDocs"
              :key="'bridge-' + d.hitId"
              :cx="d.x"
              :cy="d.y"
              :r="dotRadius(d) + 4"
              :opacity="opacityForDoc(d) * 0.35"
              :stroke="bioregionColor(primaryBioregion(d.regions))"
              fill="none"
              stroke-width="2"
              stroke-dasharray="3 3"
              class="pointer-events-none transition-all duration-200"
            />

            <circle
              v-for="d in layoutDocs"
              :key="'hit-' + d.hitId"
              :cx="d.x"
              :cy="d.y"
              :r="dotRadius(d)"
              :opacity="opacityForDoc(d)"
              data-umap-hit="1"
              class="cursor-pointer transition-all duration-200 pointer-events-auto"
              :fill="dotFill(d)"
              :stroke="dotStroke(d)"
              :stroke-width="isBioregionBridge(d.regions) ? 3 : 2"
              @mouseenter="(e) => showDocTip(e, d)"
              @mousemove="moveTip"
              @mouseleave="hideTip"
              @click.stop="onDocClick(d)"
            />

            <text
              v-for="c in layoutRegionCircles"
              :key="'lbl-' + c.region"
              :x="c.cx"
              :y="c.labelY"
              :opacity="labelOpacityForRegion(c.region)"
              text-anchor="middle"
              dominant-baseline="middle"
              class="pointer-events-none select-none text-[11px] font-semibold transition-opacity duration-200"
              :fill="bioregionColor(c.region)"
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
          class="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
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
import type { ArticleDetail, SearchResult } from '@/types/search'
import {
  bioregionColor,
  bioregionFill,
  buildPerHitUmapVectors,
  isBioregionBridge,
  isUnidentifiedRegion,
  primaryBioregion,
  type SearchHitLike,
} from '@/utils/explorerBioregions'
import { runDeterministicUmap } from '@/utils/umapLayout'
import { useFacetLabel } from '@/composables/useFacetLabel'

const { facetLabel } = useFacetLabel()
const { t } = useI18n()

const DOT_R = 8
const BRIDGE_EXTRA_R = 2
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
  regions: string[]
}

type RegionCircleLayout = {
  region: string
  cx: number
  cy: number
  r: number
  count: number
  labelY: number
}

const layoutDocs = ref<DocLayout[]>([])
const layoutRegionCircles = ref<RegionCircleLayout[]>([])

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
const blockDocClick = ref(false)

const isGrabbing = computed(() => Boolean(canvasDrag.value?.active))

const focusedRegion = ref<string | null>(null)
const pinnedRegion = ref<string | null>(null)

const DIMMED_OPACITY = 0.1
const DEFAULT_RING_STROKE_OPACITY = 0.25

const legendItems = computed(() =>
  [...layoutRegionCircles.value].sort((a, b) => b.count - a.count || a.region.localeCompare(b.region))
)

const bridgeDocs = computed(() => layoutDocs.value.filter((d) => isBioregionBridge(d.regions)))

function opacityForRegion(name: string) {
  const f = focusedRegion.value
  if (!f) return 1
  return f === name ? 1 : DIMMED_OPACITY
}

function opacityForDoc(d: DocLayout) {
  const f = focusedRegion.value
  if (!f) return 1
  return d.regions.includes(f) ? 1 : DIMMED_OPACITY
}

function labelOpacityForRegion(name: string) {
  const f = focusedRegion.value
  if (!f) return 0.85
  return f === name ? 1 : DIMMED_OPACITY
}

function ringStrokeOpacity(region: string) {
  const f = focusedRegion.value
  if (!f) return DEFAULT_RING_STROKE_OPACITY
  return f === region ? 0.9 : DIMMED_OPACITY
}

function ringFill(region: string) {
  const f = focusedRegion.value
  const alpha = !f ? 0.04 : f === region ? 0.12 : 0.02
  return bioregionFill(region, alpha)
}

function dotRadius(d: DocLayout) {
  return isBioregionBridge(d.regions) ? DOT_R + BRIDGE_EXTRA_R : DOT_R
}

function dotFill(d: DocLayout) {
  if (isBioregionBridge(d.regions)) return '#fffbf8'
  return bioregionColor(primaryBioregion(d.regions))
}

function dotStroke(d: DocLayout) {
  return bioregionColor(primaryBioregion(d.regions))
}

function clearFocusedRegion() {
  focusedRegion.value = null
  pinnedRegion.value = null
}

function togglePinnedRegion(region: string) {
  pinnedRegion.value = pinnedRegion.value === region ? null : region
  focusedRegion.value = pinnedRegion.value
}

function onRegionClick(c: RegionCircleLayout) {
  if (blockDocClick.value) return
  togglePinnedRegion(c.region)
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
  const regionLines = d.regions.map((r) => `• ${displayRegionLabel(r)}`).join('\n')
  if (isBioregionBridge(d.regions)) {
    tooltip.subtitle = `${t('viewModes.umapBridgeSpans')}\n${regionLines}`
  } else {
    tooltip.subtitle = `${t('viewModes.umapBioregionsLabel')}\n${regionLines || '• —'}`
  }
  moveTip(e)
}

function showRegionTip(e: MouseEvent, c: RegionCircleLayout) {
  tooltip.visible = true
  tooltip.title = displayRegionLabel(c.region)
  tooltip.subtitle =
    c.count === 1
      ? t('viewModes.umapRegionCountOne')
      : t('viewModes.umapRegionCountMany', { count: c.count })
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
  const translated = facetLabel('biogeographical_regions', name)
  if (translated.length <= REGION_LABEL_MAX) return translated
  return `${translated.slice(0, REGION_LABEL_MAX - 1)}…`
}

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
      embedding = runDeterministicUmap(rows, {
        nPoints: hits.length,
        seed: 42,
        nNeighbors: 12,
        minDist: 0.4,
      })
    } catch {
      embedding = hits.map((_, i) => {
        const angle = (2 * Math.PI * i) / hits.length
        return [Math.cos(angle) * 0.5, Math.sin(angle) * 0.5] as [number, number]
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
    const regions = perHitRegions[i]!
    return {
      hitId: hit.id,
      x: scaleX(emb[0]!),
      y: scaleY(emb[1]!),
      r: isBioregionBridge(regions) ? DOT_R + BRIDGE_EXTRA_R : DOT_R,
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
    pinnedRegion.value = null
    const { docs, regions } = computeLayout(width.value, height.value)
    layoutDocs.value = docs
    layoutRegionCircles.value = regions
  },
  { deep: true, immediate: true }
)
</script>
