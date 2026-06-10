<template>
  <div
    ref="el"
    class="relative h-full w-full bg-warm-neutral-300"
    @mousemove="updateTooltipPosition"
    @mouseenter="showZoomHint = true"
    @mouseleave="showZoomHint = false"
  >
    <p
      v-if="isSvgReady && showZoomHint"
      class="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-md bg-neutral-lightest/90 px-2 py-1 font-mono text-2xs text-neutral-dark shadow backdrop-blur-sm"
    >
      {{ zoomHintLabel }}
    </p>

    <svg
      v-if="isSvgReady"
      ref="svgEl"
      :width="width"
      :height="height"
      :viewBox="viewBox"
      class="touch-pan-y"
    >
      <g ref="zoomLayer">
        <path
          :d="graticulePath"
          fill="none"
          class="stroke-[#d8d0c6]"
          stroke-width="0.5"
          stroke-dasharray="2 2"
        />

        <path
          v-if="nutsLandPath"
          :d="nutsLandPath"
          class="fill-[#e7e1d8]"
          stroke="none"
        />

        <path
          v-for="region in nutsPaths"
          :key="region.id"
          :d="region.d"
          class="stroke-[#cfc7bd] transition-colors duration-100"
          :class="nutsRegionClass(region.id)"
          stroke-width="0.5"
          stroke-opacity="0.5"
          @mouseover="onNutsHover(region.id)"
          @mouseleave="onNutsHover(null)"
          @click="onNutsClick(region.id)"
        />

        <circle
          v-for="entity in placedEntities"
          :key="entity.id"
          :cx="entity.geoX"
          :cy="entity.geoY"
          :r="entityRadius(entity)"
          :fill="entity.color"
          :stroke="entityStroke(entity)"
          :stroke-width="entityStrokeWidth(entity)"
          class="transition-all duration-200"
          :class="entityCircleClass(entity)"
          @mouseover="onEntityHover($event, entity)"
          @mousemove="onEntityHover($event, entity)"
          @mouseleave="onEntityLeave"
          @click.stop="onEntityClick(entity)"
        />
      </g>
    </svg>

    <div
      v-if="tooltip.visible"
      class="pointer-events-none fixed z-50 border border-neutral-darkest bg-neutral-lightest p-2 text-sm shadow-lg"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <div class="font-mono text-xs font-bold uppercase tracking-[0.06em] text-neutral-darkest">
        {{ tooltip.title }}
      </div>
      <div v-if="tooltip.subtitle" class="mt-1 text-xs text-neutral-dark">
        {{ tooltip.subtitle }}
      </div>
      <div v-if="tooltip.detail" class="mt-1 text-xs text-neutral-dark">
        {{ tooltip.detail }}
      </div>
    </div>

    <div
      v-if="isSvgReady"
      class="absolute bottom-3 left-3 z-10 flex flex-col gap-1"
    >
      <UButton
        icon="i-heroicons-plus"
        color="neutral"
        variant="soft"
        size="sm"
        class="shadow"
        title="Zoom in"
        @click="zoomIn"
      />
      <UButton
        icon="i-heroicons-minus"
        color="neutral"
        variant="soft"
        size="sm"
        class="shadow"
        title="Zoom out"
        @click="zoomOut"
      />
      <UButton
        icon="i-heroicons-arrows-pointing-in"
        color="neutral"
        variant="soft"
        size="sm"
        class="shadow"
        title="Reset zoom"
        @click="resetZoom"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn, useElementSize } from "@vueuse/core";
import * as d3 from "d3";
import type { GeoProjection, GeoPath, ZoomBehavior } from "d3";
import europeMap from "~/assets/data/europe.json";
import type { EntityWithProjects } from "~/types/connectedCordis";
import { layoutEntitiesOnMap, projectionSizeBucket, type PlacedEntity } from "~/utils/entityMapLayout";

type NutsFeature = {
  properties: { NUTS_ID: string; NUTS_NAME: string };
  geometry: GeoJSON.Geometry;
};

type SelectionMode = "nuts" | "entities";

const props = defineProps<{
  entities: EntityWithProjects[];
  nutsFeatures: NutsFeature[];
  hoveredNutsId?: string | null;
  selectedNutsIds?: string[];
  selectedEntityIds?: string[];
  selectionMode?: SelectionMode;
  activeRegionIds?: string[];
  activeEntityIds?: string[];
}>();

const emit = defineEmits<{
  hoverNuts: [nutsId: string | null];
  toggleNuts: [nutsId: string];
  toggleEntity: [entityId: string];
}>();

const el = useTemplateRef("el");
const svgEl = useTemplateRef("svgEl");
const zoomLayer = useTemplateRef("zoomLayer");

const { width, height } = useElementSize(el);
const isSvgReady = computed(() => width.value > 0 && height.value > 0);
const viewBox = computed(() => `0 0 ${width.value} ${height.value}`);

const padding = 24;
const graticule = d3.geoGraticule().step([5, 5])();

let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null;

const ZOOM_STEP = 1.35;
const showZoomHint = ref(false);

const zoomHintLabel = computed(() => {
  const modifier = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform)
    ? "⌘"
    : "Ctrl";
  return `${modifier} + scroll to zoom · drag to pan · pinch with two fingers on touch`;
});

const baseProjection = shallowRef<GeoProjection | null>(null);
const basePath = shallowRef<GeoPath | null>(null);
const projectionBucket = ref("");

const hoveredEntityId = ref<string | null>(null);
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  title: "",
  subtitle: "",
  detail: "",
});

const graticulePath = computed(() => basePath.value?.(graticule) ?? "");
const nutsLandPath = computed(() => {
  if (!basePath.value || !props.nutsFeatures.length) return "";
  return basePath.value({
    type: "FeatureCollection",
    features: props.nutsFeatures,
  } as GeoJSON.FeatureCollection);
});

type NutsPathItem = { id: string; d: string };
const nutsPaths = shallowRef<NutsPathItem[]>([]);
const placedEntities = shallowRef<PlacedEntity[]>([]);

const activeEntityIds = computed(() => new Set(props.activeEntityIds ?? []));
const selectedEntityIdsSet = computed(() => new Set(props.selectedEntityIds ?? []));
const isNutsMode = computed(() => (props.selectionMode ?? "nuts") === "nuts");
const isEntitiesMode = computed(() => (props.selectionMode ?? "nuts") === "entities");

const maxProjectsTotalCost = computed(() =>
  Math.max(...(props.entities ?? []).map((e) => e.projectsTotalCost || 0), 1)
);
const maxProjectsCount = computed(() =>
  Math.max(...(props.entities ?? []).map((e) => e.projectsCount || 0), 1)
);

const projectsTotalCostScale = computed(() =>
  d3.scalePow().exponent(0.5).domain([0, maxProjectsTotalCost.value]).range([1.5, 7])
);
const linearColorScale = computed(() =>
  d3.scaleLinear<string>().domain([0, maxProjectsCount.value]).range(["#9cc0db", "#13497c"])
);

function nutsRegionClass(nutsId: string) {
  const cursor = isNutsMode.value ? "cursor-pointer" : "cursor-default";

  if (!isNutsMode.value) {
    if (props.activeRegionIds?.includes(nutsId)) {
      return `fill-neutral-lightest ${cursor}`;
    }
    return `fill-[#f2ece4] ${cursor}`;
  }

  if (props.selectedNutsIds?.includes(nutsId)) {
    return `fill-trust-blue-darkest ${cursor}`;
  }
  if (props.hoveredNutsId === nutsId) {
    return `fill-trust-blue-light ${cursor}`;
  }
  if (props.activeRegionIds?.includes(nutsId)) {
    return `fill-neutral-lightest ${cursor} hover:fill-trust-blue-light`;
  }
  return `fill-[#f2ece4] ${cursor} hover:fill-trust-blue-light/60`;
}

function isEntityInteractive(entity: PlacedEntity) {
  return isEntitiesMode.value && entity.hasGeolocation;
}

function isEntityHighlighted(entity: PlacedEntity) {
  if (!isEntitiesMode.value) {
    return activeEntityIds.value.has(entity.id);
  }
  if (!hoveredEntityId.value) {
    return activeEntityIds.value.has(entity.id);
  }
  return hoveredEntityId.value === entity.id;
}

function entityCircleClass(entity: PlacedEntity) {
  const interactive = isEntityInteractive(entity);

  if (!isEntitiesMode.value) {
    const active = activeEntityIds.value.has(entity.id);
    return [
      active ? "opacity-40" : "opacity-[0.08] grayscale",
      "pointer-events-none",
    ];
  }

  const highlighted = isEntityHighlighted(entity);
  return [
    highlighted ? "opacity-100" : "opacity-20 grayscale",
    interactive ? "pointer-events-auto cursor-pointer" : "pointer-events-none",
  ];
}

function entityRadius(entity: PlacedEntity) {
  const base = entity.r;
  if (isEntitiesMode.value && hoveredEntityId.value === entity.id) {
    return base * 1.35;
  }
  return base;
}

function entityStroke(entity: PlacedEntity) {
  if (selectedEntityIdsSet.value.has(entity.id)) return "#13497c";
  if (isEntitiesMode.value && hoveredEntityId.value === entity.id) return "#5a9fd4";
  return "none";
}

function entityStrokeWidth(entity: PlacedEntity) {
  if (selectedEntityIdsSet.value.has(entity.id)) return 2;
  if (isEntitiesMode.value && hoveredEntityId.value === entity.id) return 2.5;
  return 0;
}

function onNutsHover(nutsId: string | null) {
  if (!isNutsMode.value) return;
  emit("hoverNuts", nutsId);
}

function onNutsClick(nutsId: string) {
  if (!isNutsMode.value) return;
  emit("toggleNuts", nutsId);
}

function onEntityHover(event: MouseEvent, entity: PlacedEntity) {
  if (!isEntityInteractive(entity)) return;

  hoveredEntityId.value = entity.id;
  tooltip.value = {
    visible: true,
    x: event.clientX + 12,
    y: event.clientY - 12,
    title: entity.short_name || entity.legal_name || entity.id,
    subtitle: entity.legal_name && entity.short_name ? entity.legal_name : "",
    detail: `${entity.projectsCount ?? 0} projects · ${(entity.projectsTotalCost ?? 0).toLocaleString()} €`,
  };
}

function onEntityLeave() {
  hoveredEntityId.value = null;
  tooltip.value.visible = false;
}

function updateTooltipPosition(event: MouseEvent) {
  if (!tooltip.value.visible) return;
  tooltip.value.x = event.clientX + 12;
  tooltip.value.y = event.clientY - 12;
}

function onEntityClick(entity: PlacedEntity) {
  if (!isEntityInteractive(entity)) return;
  emit("toggleEntity", entity.id);
}

function buildProjection(): GeoProjection | null {
  if (width.value <= 0 || height.value <= 0) return null;

  const projection = d3.geoConicEquidistant().fitExtent(
    [
      [padding, padding],
      [width.value - padding, height.value - padding],
    ],
    europeMap as GeoJSON.GeoJsonObject
  );

  return projection;
}

function rebuildGeometry() {
  const projection = buildProjection();
  if (!projection) return;

  const path = d3.geoPath().projection(projection);
  baseProjection.value = projection;
  basePath.value = path;
  projectionBucket.value = projectionSizeBucket(width.value, height.value);

  nutsPaths.value = props.nutsFeatures.map((feature) => ({
    id: feature.properties.NUTS_ID,
    d: path(feature as GeoJSON.Feature) ?? "",
  }));

  placedEntities.value = layoutEntitiesOnMap(
    props.entities,
    projection,
    (cost) => projectsTotalCostScale.value(cost),
    (count) => linearColorScale.value(count)
  );
}

const debouncedRebuild = useDebounceFn(() => {
  rebuildGeometry();
  if (zoomBehavior) resetZoom();
}, 150);

function zoomEventFilter(event: Event): boolean {
  const e = event as WheelEvent & MouseEvent & TouchEvent;

  if (e.type === "wheel") {
    return e.ctrlKey || e.metaKey;
  }

  if (e.type === "touchstart" || e.type === "touchmove" || e.type === "touchend") {
    return (e.touches?.length ?? 0) >= 2;
  }

  return !e.ctrlKey && !e.button;
}

function resetZoom() {
  if (!svgEl.value || !zoomBehavior) return;
  d3.select(svgEl.value).transition().duration(250).call(zoomBehavior.transform, d3.zoomIdentity);
}

function zoomBy(factor: number) {
  if (!svgEl.value || !zoomBehavior) return;
  d3.select(svgEl.value).transition().duration(200).call(zoomBehavior.scaleBy, factor);
}

function zoomIn() {
  zoomBy(ZOOM_STEP);
}

function zoomOut() {
  zoomBy(1 / ZOOM_STEP);
}

function setupZoom() {
  if (!svgEl.value || !zoomLayer.value) return;

  zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .filter(zoomEventFilter)
    .on("zoom", (event) => {
      if (zoomLayer.value) {
        d3.select(zoomLayer.value).attr("transform", event.transform.toString());
      }
    });

  d3.select(svgEl.value).call(zoomBehavior).on("dblclick.zoom", null);
  resetZoom();
}

watch(
  () => props.selectionMode,
  () => {
    hoveredEntityId.value = null;
    tooltip.value.visible = false;
    if (!isNutsMode.value) emit("hoverNuts", null);
  }
);

watch(
  () => [props.nutsFeatures, props.entities, width.value, height.value] as const,
  () => {
    if (!isSvgReady.value) return;
    debouncedRebuild();
  },
  { immediate: true }
);

watch(isSvgReady, (ready) => {
  if (!ready) return;
  nextTick(() => {
    rebuildGeometry();
    setupZoom();
  });
});

onBeforeUnmount(() => {
  if (svgEl.value) d3.select(svgEl.value).on(".zoom", null);
});
</script>
