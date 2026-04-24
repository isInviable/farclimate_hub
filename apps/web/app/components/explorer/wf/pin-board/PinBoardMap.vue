<template>
  <div class="relative w-full h-full">
    <div v-if="groups.length === 0"
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6 pointer-events-none">
      <Icon name="mdi:map-search-outline" size="3rem" class="text-gray-400" />
      <p class="text-sm text-gray-500 max-w-sm">
        {{ $t("pins.map.emptyBody") }}
      </p>
    </div>

    <div v-show="groups.length > 0" ref="map-container" class="w-full h-full" />

    <div
      v-show="groups.length > 0 && !isMapLoaded"
      class="absolute inset-0 flex items-center justify-center bg-white/60"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin text-primary-500"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { FeatureCollection, Feature, Point } from "geojson";
import type { HumanPinRow } from "~/types/pins";
import { groupPinsForMap, type PinMapGroup } from "~/utils/pinBoardMap";

const props = defineProps<{
  pins: HumanPinRow[];
}>();

const emit = defineEmits<{
  (e: "open-article", payload: { documentUid: string; pins: HumanPinRow[] }): void;
}>();

const { t, te } = useI18n();
const config = useRuntimeConfig();
const MAPBOX_ACCESS_TOKEN = config.public.mapbox.accessToken;

const mapContainer = useTemplateRef("map-container");
const isMapLoaded = ref(false);
const mapRef = shallowRef<mapboxgl.Map | null>(null);
const hoverPopup = shallowRef<mapboxgl.Popup | null>(null);
const clickPopup = shallowRef<mapboxgl.Popup | null>(null);

/**
 * Derived per-article groups. One group → one marker. Keeping a stable
 * reference here lets the click handler look up the group by
 * `documentUid` without walking the pin list.
 */
const groups = computed<PinMapGroup[]>(() => groupPinsForMap(props.pins));

const groupsByUid = computed<Map<string, PinMapGroup>>(() => {
  const m = new Map<string, PinMapGroup>();
  for (const g of groups.value) m.set(g.documentUid, g);
  return m;
});

const featureCollection = computed<FeatureCollection<Point>>(() => ({
  type: "FeatureCollection",
  features: groups.value.map(
    (group): Feature<Point> => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [group.location[1], group.location[0]],
      },
      properties: {
        documentUid: group.documentUid,
        title: group.title || t("pins.noTitle"),
      },
    })
  ),
}));

/**
 * Key describing "did the set of marker coordinates change?". We call
 * `fitBounds` only when this changes, so simple note edits (which don't
 * affect position) don't yank the user's camera.
 */
const coordinatesKey = computed(() =>
  groups.value
    .map((g) => `${g.documentUid}:${g.location[0]},${g.location[1]}`)
    .sort()
    .join("|")
);

function kindLabel(kind: string): string {
  const key = `pins.kinds.${kind}`;
  return te(key) ? t(key) : t("pins.kinds.unknown");
}

function truncateNote(raw: string | null): string {
  if (!raw) return "";
  const s = raw.trim();
  if (s.length <= 120) return s;
  return `${s.slice(0, 120).trimEnd()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPopupHtml(group: PinMapGroup): string {
  const title = group.title || t("pins.noTitle");
  const header = t("pins.map.popupPinsHeader", { count: group.pins.length });
  const rows = group.pins
    .map((pin) => {
      const label = escapeHtml(kindLabel(pin.body_kind));
      const note = escapeHtml(truncateNote(pin.user_note));
      const noteBlock = note
        ? `<div class="text-xs text-neutral-600 mt-0.5 break-words">${note}</div>`
        : "";
      return `
        <li class="py-1">
          <div class="text-xs font-medium text-neutral-800">${label}</div>
          ${noteBlock}
        </li>`;
    })
    .join("");

  const openLabel = escapeHtml(t("pins.drawer.openArticle"));
  const hasUid = !!group.documentUid;
  const btnAttrs = hasUid
    ? `data-pb-open-article="${escapeHtml(group.documentUid)}"`
    : "disabled aria-disabled=\"true\"";
  const btnClasses = hasUid
    ? "mt-3 w-full inline-flex items-center justify-center gap-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded px-3 py-1.5 cursor-pointer"
    : "mt-3 w-full inline-flex items-center justify-center gap-1 text-xs font-medium text-neutral-400 bg-neutral-100 rounded px-3 py-1.5 cursor-not-allowed";

  return `
    <div class="pb-map-popup">
      <div class="font-semibold text-sm text-neutral-900 break-words">${escapeHtml(
        title
      )}</div>
      <div class="text-[11px] uppercase tracking-wide text-neutral-500 mt-1">${escapeHtml(
        header
      )}</div>
      <ul class="mt-1 divide-y divide-neutral-100 max-h-64 overflow-y-auto">${rows}</ul>
      <button type="button" class="${btnClasses}" ${btnAttrs}>${openLabel}</button>
    </div>
  `;
}

/**
 * Click handler attached once per click-popup. The popup HTML is rendered
 * as a static string so we use event delegation via the popup DOM node to
 * translate DOM clicks into component events.
 */
function bindPopupOpenArticle(group: PinMapGroup) {
  const popup = clickPopup.value;
  if (!popup) return;
  const el = popup.getElement();
  if (!el) return;
  const btn = el.querySelector<HTMLButtonElement>("[data-pb-open-article]");
  if (!btn) return;
  btn.addEventListener(
    "click",
    () => {
      const uid = btn.getAttribute("data-pb-open-article") || "";
      if (!uid) return;
      emit("open-article", { documentUid: uid, pins: group.pins });
      popup.remove();
    },
    { once: true }
  );
}

function fitMapToBounds(map: mapboxgl.Map) {
  const features = featureCollection.value.features;
  if (features.length === 0) return;

  map.setProjection("equalEarth");

  if (features.length === 1) {
    map.flyTo({
      center: features[0].geometry.coordinates as [number, number],
      zoom: 6,
    });
    return;
  }

  const coordinates = features.map((f) => f.geometry.coordinates);
  const lngs = coordinates.map((c) => c[0]);
  const lats = coordinates.map((c) => c[1]);
  const bounds = new mapboxgl.LngLatBounds(
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  );
  map.fitBounds(bounds, { padding: 50, duration: 600 });
}

watch(featureCollection, (next) => {
  const map = mapRef.value;
  if (!map || !isMapLoaded.value) return;
  const source = map.getSource("pinboard-points") as mapboxgl.GeoJSONSource | undefined;
  if (source) source.setData(next);
});

watch(coordinatesKey, () => {
  const map = mapRef.value;
  if (!map || !isMapLoaded.value) return;
  fitMapToBounds(map);
});

onMounted(() => {
  if (!mapContainer.value) return;
  if (groups.value.length === 0) return;

  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
  const map = new mapboxgl.Map({
    container: mapContainer.value,
    style: "mapbox://styles/mapbox/light-v11",
    center: [10.347306753029532, 50.022992288945396],
    zoom: 2,
    maxZoom: 15,
    minZoom: 1,
  });
  mapRef.value = map;

  map.on("load", () => {
    map.addControl(new mapboxgl.NavigationControl(), "top-left");

    map.addSource("pinboard-points", {
      type: "geojson",
      data: featureCollection.value,
    });

    map.addLayer({
      id: "pinboard-points",
      type: "circle",
      source: "pinboard-points",
      paint: {
        "circle-color": "#00bba7",
        "circle-radius": 6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    hoverPopup.value = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
    });

    clickPopup.value = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "320px",
      offset: 14,
    });

    map.on("mouseenter", "pinboard-points", (e) => {
      if (!e.features || e.features.length === 0) return;
      map.getCanvas().style.cursor = "pointer";
      const feature = e.features[0];
      if (feature.geometry.type !== "Point") return;
      const title = feature.properties?.title;
      if (!title) return;
      hoverPopup.value
        ?.setLngLat(feature.geometry.coordinates as [number, number])
        .setHTML(`<div class="text-xs font-medium">${escapeHtml(String(title))}</div>`)
        .addTo(map);
    });

    map.on("mouseleave", "pinboard-points", () => {
      map.getCanvas().style.cursor = "";
      hoverPopup.value?.remove();
    });

    map.on("click", "pinboard-points", (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      if (feature.geometry.type !== "Point") return;
      const uid = feature.properties?.documentUid;
      if (!uid) return;
      const group = groupsByUid.value.get(String(uid));
      if (!group) return;
      hoverPopup.value?.remove();
      clickPopup.value
        ?.setLngLat(feature.geometry.coordinates as [number, number])
        .setHTML(renderPopupHtml(group))
        .addTo(map);
      bindPopupOpenArticle(group);
    });

    fitMapToBounds(map);
    isMapLoaded.value = true;
  });
});

onBeforeUnmount(() => {
  hoverPopup.value?.remove();
  clickPopup.value?.remove();
  mapRef.value?.remove();
  mapRef.value = null;
});
</script>

<style scoped>
:deep(.pb-map-popup) {
  padding: 4px 6px 2px;
}
</style>
